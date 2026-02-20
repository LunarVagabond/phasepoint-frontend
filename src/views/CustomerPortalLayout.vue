<template>
  <div class="customer-layout-shell">
    <header class="customer-topbar">
      <div class="topbar-left">
        <router-link :to="`${basePath}`" class="brand">Phasepoint</router-link>
        <span class="brand-subtitle">Customer Portal</span>
        <span v-if="isReadonlyPortal" class="readonly-tag">Read-only preview</span>
      </div>
      <div class="topbar-right-group">
        <nav class="topbar-nav">
          <router-link :to="`${basePath}`" class="nav-link" active-class="active" exact-active-class="active">Dashboard</router-link>
          <router-link :to="`${basePath}/insights`" class="nav-link" active-class="active">Insights</router-link>
          <router-link :to="`${basePath}/requests/new`" class="nav-link" active-class="active">Create Request</router-link>
          <router-link :to="`${basePath}/tracking`" class="nav-link" active-class="active">Tracking</router-link>
          <router-link :to="`${basePath}/users`" class="nav-link" active-class="active">Team Users</router-link>
          <router-link :to="`${basePath}/profile`" class="nav-link" active-class="active">Profile</router-link>
          <router-link :to="`${basePath}/terms`" class="nav-link" active-class="active">Terms</router-link>
        </nav>
        <div class="topbar-right">
        <button type="button" class="theme-toggle" :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleTheme">
          <svg v-if="theme === 'dark'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
        <a v-if="!isReadonlyPortal" href="#" class="logout" @click.prevent="logout">Log out</a>
        </div>
      </div>
    </header>
    <nav
      v-if="isTrackingRoute"
      class="customer-tracking-subnav"
      aria-label="Tracking"
    >
      <router-link :to="`${basePath}/tracking/requests`" class="tracking-tab" active-class="active">Requests</router-link>
      <router-link :to="`${basePath}/tracking/assets`" class="tracking-tab" active-class="active">Assets</router-link>
      <router-link :to="`${basePath}/tracking/shipments`" class="tracking-tab" active-class="active">Shipments</router-link>
      <router-link :to="`${basePath}/tracking/audit`" class="tracking-tab" active-class="active">Audit Trail</router-link>
    </nav>
    <EnvironmentBanner />
    <main class="customer-main app-footer-padding">
      <div class="customer-main-inner">
        <router-view />
      </div>
    </main>
    <AppFooter />
    <CustomerProfileCompletionModal
      :open="showProfileModal"
      :initial-email="profileEmail"
      :initial-phone="profilePhone"
      :initial-address-line1="profileAddressLine1"
      :initial-address-line2="profileAddressLine2"
      :initial-city="profileCity"
      :initial-province="profileProvince"
      :initial-country="profileCountry"
      :initial-postal-code="profilePostalCode"
      :saving="profileSaving"
      :error="profileError"
      @submit="saveProfile"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { getApiBaseForRedirect, getCustomerContext, getCustomerProfile, getMe, updateCustomerProfile } from '../api'
import AppFooter from '../components/AppFooter.vue'
import CustomerProfileCompletionModal from '../components/CustomerProfileCompletionModal.vue'
import EnvironmentBanner from '../components/EnvironmentBanner.vue'
import { useTheme } from '../composables/useTheme'

const { theme, toggleTheme } = useTheme()

const showProfileModal = ref(false)
const profileSaving = ref(false)
const profileError = ref('')
const profileEmail = ref('')
const profilePhone = ref('')
const profileAddressLine1 = ref('')
const profileAddressLine2 = ref('')
const profileCity = ref('')
const profileProvince = ref('')
const profileCountry = ref('')
const profilePostalCode = ref('')
const route = useRoute()
const previewCompanyName = ref('')
const pageTitleRef = inject<Ref<string>>('pageTitle', ref(''))
const isReadonlyPortal = computed(() => route.path.includes('/employee-portal/customers/') || Boolean(route.meta.customerPortalReadonly))
const isTrackingRoute = computed(() => route.path.includes('/tracking'))
const basePath = computed(() => {
  if (route.path.includes('/employee-portal/customers/')) {
    return `/employee-portal/customers/${String(route.params.customerId || '')}/portal`
  }
  return '/customer-portal'
})
function logout() {
  const apiBase = getApiBaseForRedirect()
  const nextUrl = encodeURIComponent(window.location.origin + "/login")
  window.location.href = `${apiBase}/api/auth/logout/?next=${nextUrl}`
}

async function hydrateProfileGate() {
  const me = await getMe()
  if (me.user_type !== 'CUSTOMER') return
  if (route.meta.customerPortalReadonly) return
  const profile = await getCustomerProfile()
  profileEmail.value = profile.email || ''
  profilePhone.value = profile.phone || ''
  profileAddressLine1.value = profile.address_line1 || ''
  profileAddressLine2.value = profile.address_line2 || ''
  profileCity.value = profile.city || ''
  profileProvince.value = profile.province || ''
  profileCountry.value = profile.country || ''
  profilePostalCode.value = profile.postal_code || ''
  showProfileModal.value = !(
    (profile.email || '').trim()
    && (profile.phone || '').trim()
    && (profile.address_line1 || '').trim()
    && (profile.city || '').trim()
    && (profile.province || '').trim()
    && (profile.country || '').trim()
    && (profile.postal_code || '').trim()
  )
}

async function saveProfile(payload: {
  email: string
  phone: string
  address_line1: string
  address_line2: string
  city: string
  province: string
  country: string
  postal_code: string
}) {
  profileError.value = ''
  profileSaving.value = true
  try {
    const updated = await updateCustomerProfile(payload)
    profileEmail.value = updated.email || ''
    profilePhone.value = updated.phone || ''
    profileAddressLine1.value = updated.address_line1 || ''
    profileAddressLine2.value = updated.address_line2 || ''
    profileCity.value = updated.city || ''
    profileProvince.value = updated.province || ''
    profileCountry.value = updated.country || ''
    profilePostalCode.value = updated.postal_code || ''
    showProfileModal.value = false
  } catch (e) {
    profileError.value = e instanceof Error ? e.message : 'Failed to update profile.'
  } finally {
    profileSaving.value = false
  }
}

onMounted(() => {
  hydrateProfileGate().catch(() => {})
  if (isReadonlyPortal.value) {
    const customerId = String(route.params.customerId || '')
    if (customerId) {
      getCustomerContext(customerId)
        .then((ctx) => {
          previewCompanyName.value = ctx.customer?.name || ''
          if (pageTitleRef) {
            pageTitleRef.value = previewCompanyName.value.trim()
              ? `Viewing ${previewCompanyName.value}'s Dashboard`
              : 'Viewing Customer Dashboard'
          }
        })
        .catch(() => {})
    }
  }
})

onUnmounted(() => {
  if (pageTitleRef) pageTitleRef.value = ''
})
</script>
