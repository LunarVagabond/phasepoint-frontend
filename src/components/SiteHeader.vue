<template>
  <header ref="headerRef" class="site-header">
    <router-link to="/employee-portal" class="brand">Phasepoint</router-link>
    <h1 class="page-title">{{ pageTitle }}</h1>
    <button type="button" class="mobile-menu-toggle" :aria-expanded="isMobileMenuOpen" aria-label="Toggle navigation menu" @click.stop="toggleMobileMenu">
      <svg v-if="!isMobileMenuOpen" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    <nav class="nav nav-right" :class="{ 'mobile-open': isMobileMenuOpen }">
      <div class="mobile-menu-header">
        <h2 class="mobile-menu-title">Menu</h2>
        <button type="button" class="mobile-menu-close" aria-label="Close menu" @click.stop="closeMobileMenu">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <router-link to="/employee-portal" exact-active-class="active" class="nav-item">Dashboard</router-link>
      <span class="nav-sep" aria-hidden="true">|</span>
      <details class="menu-dropdown" :class="{ active: isOperationsActive }" :open="openDropdown === 'operations'">
        <summary @click.prevent="toggleDropdown('operations')" class="nav-item">
          <span class="menu-dropdown-label">Operations</span>
          <svg class="menu-dropdown-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </summary>
        <div class="menu-list">
          <router-link v-if="!policyOnly" to="/employee-portal/intake" active-class="active">Intake</router-link>
          <a v-else href="#" class="disabled" @click.prevent>Intake</a>
          <router-link v-if="!policyOnly" to="/employee-portal/batches" active-class="active">Batches</router-link>
          <a v-else href="#" class="disabled" @click.prevent>Batches</a>
          <router-link v-if="!policyOnly" to="/employee-portal/assets" active-class="active">Assets</router-link>
          <a v-else href="#" class="disabled" @click.prevent>Assets</a>
          <router-link v-if="!policyOnly" to="/employee-portal/work-orders" active-class="active">Work Orders</router-link>
          <a v-else href="#" class="disabled" @click.prevent>Work Orders</a>
          <router-link v-if="!policyOnly" to="/employee-portal/shipments" active-class="active">Shipments</router-link>
          <a v-else href="#" class="disabled" @click.prevent>Shipments</a>
        </div>
      </details>
      <span class="nav-sep" aria-hidden="true">|</span>
      <details class="menu-dropdown" :class="{ active: isReportsAuditActive }" :open="openDropdown === 'reports'">
        <summary @click.prevent="toggleDropdown('reports')" class="nav-item">
          <span class="menu-dropdown-label">Reports &amp; Audit</span>
          <svg class="menu-dropdown-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </summary>
        <div class="menu-list">
          <router-link v-if="!policyOnly" to="/employee-portal/reports" active-class="active">Reports</router-link>
          <a v-else href="#" class="disabled" @click.prevent>Reports</a>
          <router-link v-if="!policyOnly" to="/employee-portal/audit" active-class="active">Audit</router-link>
          <a v-else href="#" class="disabled" @click.prevent>Audit</a>
        </div>
      </details>
      <span class="nav-sep" aria-hidden="true">|</span>
      <details class="menu-dropdown" :class="{ active: isDocsActive }" :open="openDropdown === 'docs'">
        <summary @click.prevent="toggleDropdown('docs')" class="nav-item">
          <span class="menu-dropdown-label">Docs</span>
          <svg class="menu-dropdown-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </summary>
        <div class="menu-list">
          <router-link :to="{ name: 'AllPolicies' }" active-class="active">Policies</router-link>
          <router-link :to="{ name: 'Procedures' }" active-class="active">Processes and Procedures</router-link>
        </div>
      </details>
      <span class="nav-sep" aria-hidden="true">|</span>
      <router-link v-if="!policyOnly" to="/employee-portal/status-requests" class="status-inbox-nav nav-item" active-class="active" aria-label="Status requests">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
        <span v-if="pendingStatusCount > 0" class="status-inbox-count" aria-hidden="true">{{ pendingStatusCount > 99 ? '99+' : pendingStatusCount }}</span>
      </router-link>
      <span v-if="!policyOnly" class="nav-sep" aria-hidden="true">|</span>
      <router-link to="/employee-portal/profile" class="profile-cog nav-item" active-class="active" aria-label="Profile">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </router-link>
      <span class="nav-sep" aria-hidden="true">|</span>
      <button type="button" class="theme-toggle nav-item" :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleTheme">
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
      <span class="nav-sep" aria-hidden="true">|</span>
      <a href="#" class="logout nav-item" @click.prevent="logout">Log out</a>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed, inject, ref, onMounted, onUnmounted, watch, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { getApiBaseForRedirect, getPendingStatusRequests } from '../api'
import { useTheme } from '../composables/useTheme'

const props = defineProps<{
  policyOnly?: boolean
}>()

const route = useRoute()
const headerRef = ref<HTMLElement | null>(null)
type DropdownId = 'operations' | 'reports' | 'docs'
const openDropdown = ref<DropdownId | null>(null)
const isMobileMenuOpen = ref(false)
const pendingStatusCount = ref(0)

const { theme, toggleTheme } = useTheme()

function toggleDropdown(id: DropdownId) {
  openDropdown.value = openDropdown.value === id ? null : id
}

function closeAllDropdowns() {
  openDropdown.value = null
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  if (!isMobileMenuOpen.value) {
    closeAllDropdowns()
  }
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
  closeAllDropdowns()
}

function onDocumentClick(e: MouseEvent) {
  const target = e.target as Node
  if (headerRef.value && !headerRef.value.contains(target)) {
    closeAllDropdowns()
    isMobileMenuOpen.value = false
  }
}

const pageTitleRef = inject<Ref<string>>('pageTitle', ref(''))
const pageTitle = computed(() => pageTitleRef.value || (route.meta.title as string) || '')

watch(
  () => route.path,
  () => {
    openDropdown.value = null
    isMobileMenuOpen.value = false
  }
)

// Refresh pending count when leaving Status Requests page so badge updates after responding
watch(
  () => route.name,
  (name, prev) => {
    if (prev === 'StatusRequestsInbox' && name !== 'StatusRequestsInbox' && !props.policyOnly) {
      fetchPendingStatusCount()
    }
  }
)

const isOperationsActive = computed(() => {
  const name = route.name as string
  const path = route.path
  return name === 'Intake' || name === 'Batches' || name === 'Assets' || name === 'OperationsWorkOrders' || name === 'WorkOrderDetail' || name === 'ShipmentsList' || name === 'ShipmentDetail' ||
    path.startsWith('/employee-portal/intake') || path.startsWith('/employee-portal/batches') || path.startsWith('/employee-portal/assets') || path.startsWith('/employee-portal/work-orders') || path.startsWith('/employee-portal/shipments')
})

const isReportsAuditActive = computed(() => {
  const name = route.name as string
  const path = route.path
  return name === 'Reports' || name === 'Audit' || path.startsWith('/employee-portal/reports') || path.startsWith('/employee-portal/audit')
})

const isDocsActive = computed(() => {
  const name = route.name as string
  const path = route.path
  return path.startsWith('/employee-portal/policies') || path.startsWith('/employee-portal/procedures') ||
    name === 'AllPolicies' || name === 'PolicyDetail' || name === 'Policies' || name === 'PolicyDrafts' ||
    name === 'Procedures' || name === 'ProcedureDetail' || name === 'AllProcedures' || name === 'ProcedureDrafts'
})

async function fetchPendingStatusCount() {
  try {
    const list = await getPendingStatusRequests()
    pendingStatusCount.value = list.length
  } catch {
    pendingStatusCount.value = 0
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  if (!props.policyOnly) fetchPendingStatusCount()
  // Listen for status request responses to update mailbox count
  window.addEventListener('status-request-responded', fetchPendingStatusCount)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener('status-request-responded', fetchPendingStatusCount)
})

function logout() {
  const apiBase = getApiBaseForRedirect()
  const nextUrl = encodeURIComponent(window.location.origin + "/login")
  window.location.href = `${apiBase}/api/auth/logout/?next=${nextUrl}`
}
</script>
