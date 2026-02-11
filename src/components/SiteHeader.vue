<template>
  <header class="site-header">
    <router-link to="/" class="brand">Phasepoint</router-link>
    <h1 class="page-title">{{ pageTitle }}</h1>
    <nav class="nav nav-right">
      <router-link to="/" exact-active-class="active">Dashboard</router-link>
      <router-link v-if="!policyOnly" to="/intake" active-class="active">Intake</router-link>
      <router-link v-else to="/intake" class="disabled" @click.prevent>Intake</router-link>
      <router-link v-if="!policyOnly" to="/assets" active-class="active">Assets</router-link>
      <router-link v-else to="/assets" class="disabled" @click.prevent>Assets</router-link>
      <router-link v-if="!policyOnly" to="/batches" active-class="active">Batches</router-link>
      <router-link v-else to="/batches" class="disabled" @click.prevent>Batches</router-link>
      <router-link v-if="!policyOnly" to="/audit" active-class="active">Audit</router-link>
      <router-link v-else to="/audit" class="disabled" @click.prevent>Audit</router-link>
      <router-link v-if="!policyOnly" to="/reports" active-class="active">Reports</router-link>
      <router-link v-else to="/reports" class="disabled" @click.prevent>Reports</router-link>
      <router-link :to="{ name: 'AllPolicies' }" active-class="active">Policies</router-link>
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
      <a href="#" class="logout" @click.prevent="logout">Log out</a>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed, inject, ref, onMounted, type Ref } from 'vue'
import { useRoute } from 'vue-router'

defineProps<{
  policyOnly?: boolean
}>()

const route = useRoute()
const pageTitleRef = inject<Ref<string>>('pageTitle', ref(''))
const pageTitle = computed(() => pageTitleRef.value || (route.meta.title as string) || '')

const theme = ref<'light' | 'dark'>('light')

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
})

function logout() {
  // API base port must match backend API_PORT in .env (default: 3332)
  const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:3332/api").replace(/\/api\/?$/, "") || "http://localhost:3332"
  const nextUrl = encodeURIComponent(window.location.origin + "/login")
  window.location.href = `${apiBase}/api/auth/logout/?next=${nextUrl}`
}
</script>
