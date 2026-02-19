<template>
  <div v-if="shouldShow" :class="['env-banner', `env-banner--${envType}`]" :style="{ top: `${headerHeight}px` }">
    <span class="env-banner-text">{{ bannerText }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { getHealthCheck } from '../api'

const STORAGE_KEY = 'phasepoint_env'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface CachedEnv {
  env: string
  timestamp: number
}

const env = ref<string | null>(null)
const loading = ref(true)
const headerHeight = ref(0)
let resizeObserver: ResizeObserver | null = null

const envType = computed(() => {
  if (!env.value) return 'production'
  const envLower = env.value.toLowerCase()
  if (envLower === 'development' || envLower === 'dev') return 'development'
  if (envLower === 'demo' || envLower === 'staging') return 'demo'
  return 'production'
})

const bannerText = computed(() => {
  if (envType.value === 'development') return 'Development Site'
  if (envType.value === 'demo') return 'Demo Site'
  return ''
})

const shouldShow = computed(() => {
  return envType.value !== 'production' && bannerText.value !== ''
})

function getCachedEnv(): CachedEnv | null {
  try {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (!cached) return null
    const parsed: CachedEnv = JSON.parse(cached)
    const now = Date.now()
    if (now - parsed.timestamp > CACHE_DURATION) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function setCachedEnv(envValue: string) {
  try {
    const cached: CachedEnv = {
      env: envValue,
      timestamp: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached))
  } catch {
    // Ignore localStorage errors
  }
}

async function fetchEnv() {
  loading.value = true
  try {
    const health = await getHealthCheck()
    if (health?.env) {
      env.value = health.env
      setCachedEnv(health.env)
    } else {
      // Default to production if API fails
      env.value = 'production'
    }
  } catch {
    // Default to production if API fails
    env.value = 'production'
  } finally {
    loading.value = false
  }
}

function updateHeaderHeight() {
  if (typeof document === 'undefined') return
  const header = document.querySelector('.public-site-header, .site-header') as HTMLElement
  if (header) {
    headerHeight.value = header.offsetHeight
  }
}

onMounted(async () => {
  // Check cache first
  const cached = getCachedEnv()
  if (cached) {
    env.value = cached.env
    loading.value = false
    // Fetch in background to update cache
    fetchEnv()
  } else {
    // No cache, fetch immediately
    await fetchEnv()
  }
  
  // Calculate header height
  updateHeaderHeight()
  
  // Update on resize
  window.addEventListener('resize', updateHeaderHeight)
  
  // Use ResizeObserver to watch for header size changes
  const header = document.querySelector('.public-site-header, .site-header')
  if (header && window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      updateHeaderHeight()
    })
    resizeObserver.observe(header)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateHeaderHeight)
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

