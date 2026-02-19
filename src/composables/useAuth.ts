import { onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

/**
 * Composable for accessing auth state
 * Automatically fetches user on mount if not already loaded
 */
export function useAuth() {
  const authStore = useAuthStore()

  // Auto-fetch user on mount if not already loaded
  onMounted(async () => {
    if (!authStore.user && !authStore.loading) {
      await authStore.fetchUser()
    }
  })

  return {
    user: authStore.user,
    loading: authStore.loading,
    isAuthenticated: authStore.isAuthenticated,
    isEmployee: authStore.isEmployee,
    isCustomer: authStore.isCustomer,
    needsPolicyAccept: authStore.needsPolicyAccept,
    fetchUser: authStore.fetchUser,
    clearUser: authStore.clearUser,
    updateUser: authStore.updateUser,
  }
}
