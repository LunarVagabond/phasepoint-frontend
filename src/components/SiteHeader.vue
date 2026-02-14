<template>
  <header ref="headerRef" class="site-header">
    <router-link to="/employee-portal" class="brand">Phasepoint</router-link>
    <h1 class="page-title">{{ pageTitle }}</h1>
    <nav class="nav nav-right">
      <router-link to="/employee-portal" exact-active-class="active">Dashboard</router-link>
      <span class="nav-sep" aria-hidden="true">|</span>
      <details class="menu-dropdown" :class="{ active: isOperationsActive }" :open="openDropdown === 'operations'">
        <summary @click.prevent="toggleDropdown('operations')">Operations</summary>
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
        <summary @click.prevent="toggleDropdown('reports')">Reports &amp; Audit</summary>
        <div class="menu-list">
          <router-link v-if="!policyOnly" to="/employee-portal/reports" active-class="active">Reports</router-link>
          <a v-else href="#" class="disabled" @click.prevent>Reports</a>
          <router-link v-if="!policyOnly" to="/employee-portal/audit" active-class="active">Audit</router-link>
          <a v-else href="#" class="disabled" @click.prevent>Audit</a>
        </div>
      </details>
      <span class="nav-sep" aria-hidden="true">|</span>
      <details class="menu-dropdown" :class="{ active: isDocsActive }" :open="openDropdown === 'docs'">
        <summary @click.prevent="toggleDropdown('docs')">Docs</summary>
        <div class="menu-list">
          <router-link :to="{ name: 'AllPolicies' }" active-class="active">Policies</router-link>
          <router-link :to="{ name: 'Procedures' }" active-class="active">Processes and Procedures</router-link>
        </div>
      </details>
      <span class="nav-sep" aria-hidden="true">|</span>
      <router-link to="/employee-portal/profile" class="profile-cog" active-class="active" aria-label="Profile">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </router-link>
      <span class="nav-sep" aria-hidden="true">|</span>
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
      <span class="nav-sep" aria-hidden="true">|</span>
      <a href="#" class="logout" @click.prevent="logout">Log out</a>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed, inject, ref, onMounted, onUnmounted, watch, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { getApiBaseForRedirect } from '../api'

defineProps<{
  policyOnly?: boolean
}>()

const route = useRoute()
const headerRef = ref<HTMLElement | null>(null)
type DropdownId = 'operations' | 'reports' | 'docs'
const openDropdown = ref<DropdownId | null>(null)

function toggleDropdown(id: DropdownId) {
  openDropdown.value = openDropdown.value === id ? null : id
}

function closeAllDropdowns() {
  openDropdown.value = null
}

function onDocumentClick(e: MouseEvent) {
  if (headerRef.value && !headerRef.value.contains(e.target as Node)) closeAllDropdowns()
}

const pageTitleRef = inject<Ref<string>>('pageTitle', ref(''))
const pageTitle = computed(() => pageTitleRef.value || (route.meta.title as string) || '')

const theme = ref<'light' | 'dark'>('light')

watch(
  () => route.path,
  () => { openDropdown.value = null }
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

function getTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function setTheme(newTheme: 'light' | 'dark') {
  theme.value = newTheme
  document.documentElement.setAttribute('data-theme', newTheme)
  localStorage.setItem('theme', newTheme)
}

function toggleTheme() {
  setTheme(theme.value === 'dark' ? 'light' : 'dark')
}

onMounted(() => {
  const initialTheme = getTheme()
  setTheme(initialTheme)
  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})

function logout() {
  const apiBase = getApiBaseForRedirect()
  const nextUrl = encodeURIComponent(window.location.origin + "/employee-portal/login")
  window.location.href = `${apiBase}/api/auth/logout/?next=${nextUrl}`
}
</script>
