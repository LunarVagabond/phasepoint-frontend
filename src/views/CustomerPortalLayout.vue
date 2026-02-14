<template>
  <div class="customer-layout-shell">
    <header class="customer-topbar">
      <div class="topbar-left">
        <router-link :to="`${basePath}`" class="brand">Phasepoint</router-link>
        <span class="brand-subtitle">Customer Portal</span>
        <span v-if="isReadonlyPortal" class="readonly-tag">Read-only preview</span>
      </div>
      <nav class="topbar-nav">
        <router-link :to="`${basePath}`" class="nav-link" active-class="active" exact-active-class="active">Dashboard</router-link>
        <router-link :to="`${basePath}/requests/new`" class="nav-link" active-class="active">Create Request</router-link>
        <router-link :to="`${basePath}/users`" class="nav-link" active-class="active">Team Users</router-link>
        <router-link :to="`${basePath}/profile`" class="nav-link" active-class="active">Profile</router-link>
        <router-link :to="`${basePath}/terms`" class="nav-link" active-class="active">Terms</router-link>
      </nav>
      <a v-if="!isReadonlyPortal" href="#" class="logout" @click.prevent="logout">Log out</a>
    </header>
    <section class="customer-hero">
      <h1>Secure IT Asset Disposal Workspace</h1>
      <p>Track your requests, monitor disposition progress, and review sustainability outcomes in one place.</p>
    </section>
    <main class="customer-main">
      <div class="customer-main-inner">
        <router-view />
      </div>
    </main>
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
import CustomerProfileCompletionModal from '../components/CustomerProfileCompletionModal.vue'

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
const basePath = computed(() => {
  if (route.path.includes('/employee-portal/customers/')) {
    return `/employee-portal/customers/${String(route.params.customerId || '')}/portal`
  }
  return '/customer-portal'
})
function logout() {
  const apiBase = getApiBaseForRedirect()
  const nextUrl = encodeURIComponent(window.location.origin + "/customer/login")
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

<style scoped lang="scss">
@use '../styles/variables' as *;

.customer-layout-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at 20% -10%, rgba(var(--color-primary-rgb, 37, 99, 235), 0.25), transparent 45%),
    radial-gradient(circle at 90% 0%, rgba(22, 163, 74, 0.2), transparent 35%),
    var(--color-background);
}

.customer-topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: $space-6;
  padding: $space-4 $space-6;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.35);
}

.topbar-left { display: flex; align-items: baseline; gap: $space-2; }
.brand { font-size: $font-size-xl; font-weight: 700; color: #fff; text-decoration: none; }
.brand-subtitle { color: rgba(226, 232, 240, 0.9); font-size: $font-size-sm; }
.readonly-tag { color: #fde68a; font-size: $font-size-sm; }

.topbar-nav { display: flex; justify-content: center; gap: $space-2; }
.nav-link { color: #e2e8f0; text-decoration: none; padding: $space-2 $space-3; border-radius: $radius-md; }
.nav-link:hover { background: rgba(148, 163, 184, 0.2); text-decoration: none; }
.nav-link.active { background: rgba(var(--color-primary-rgb, 37, 99, 235), 0.35); color: #fff; }

.logout { color: #fecaca; text-decoration: none; }
.logout:hover { color: #fca5a5; }

.customer-hero { max-width: 1200px; margin: 0 auto; padding: $space-10 $space-6 $space-6; }
.customer-hero h1 { margin: 0 0 $space-2; font-size: clamp(1.5rem, 2vw, 2rem); }
.customer-hero p { margin: 0; color: var(--color-text-muted); }

.customer-main { padding: 0 $space-6 $space-10; }
.customer-main-inner { max-width: 1200px; margin: 0 auto; }

@media (max-width: 900px) {
  .customer-topbar { grid-template-columns: 1fr; gap: $space-3; }
  .topbar-nav { justify-content: flex-start; flex-wrap: wrap; }
}
</style>
