import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getMe, type MeResponse } from '../api'

/**
 * Auth store - manages current user state
 * This store caches user info and provides reactive access throughout the app
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<MeResponse | null>(null)
  const loading = ref(false)
  const lastFetched = ref<number | null>(null)
  
  // Cache TTL: 5 minutes
  const CACHE_TTL = 5 * 60 * 1000

  const isAuthenticated = computed(() => user.value !== null)
  const isEmployee = computed(() => user.value?.user_type === 'EMPLOYEE')
  const isCustomer = computed(() => user.value?.user_type === 'CUSTOMER')
  const needsPolicyAccept = computed(() => {
    if (!user.value) return false
    const currentHash = user.value.current_bundle_hash
    const acknowledgedHash = user.value.acknowledged_bundle_hash
    return !acknowledgedHash || currentHash !== acknowledgedHash
  })

  /**
   * Fetch user info, using cache if available and fresh
   */
  async function fetchUser(forceRefresh = false): Promise<MeResponse | null> {
    // Check cache if not forcing refresh
    if (!forceRefresh && user.value && lastFetched.value) {
      const age = Date.now() - lastFetched.value
      if (age < CACHE_TTL) {
        return user.value
      }
    }

    loading.value = true
    try {
      const data = await getMe()
      user.value = data
      lastFetched.value = Date.now()
      return data
    } catch {
      user.value = null
      lastFetched.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Clear user state (on logout)
   */
  function clearUser() {
    user.value = null
    lastFetched.value = null
  }

  /**
   * Update user info (after profile updates, etc.)
   */
  function updateUser(updates: Partial<MeResponse>) {
    if (user.value) {
      user.value = { ...user.value, ...updates }
    }
  }

  return {
    user,
    loading,
    isAuthenticated,
    isEmployee,
    isCustomer,
    needsPolicyAccept,
    fetchUser,
    clearUser,
    updateUser,
  }
})
