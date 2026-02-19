import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import { createMeResponse } from '@/test-utils/factories'

const mockGetMe = vi.fn()
vi.mock('@/api', () => ({
  getMe: (...args: unknown[]) => mockGetMe(...args),
}))

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('computed properties', () => {
    it('isAuthenticated is false when user is null', () => {
      const store = useAuthStore()
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('isAuthenticated is true when user is set', async () => {
      const me = createMeResponse()
      mockGetMe.mockResolvedValue(me)
      const store = useAuthStore()
      await store.fetchUser()
      expect(store.isAuthenticated).toBe(true)
    })

    it('isEmployee is true when user_type is EMPLOYEE', async () => {
      const me = createMeResponse({ user_type: 'EMPLOYEE' })
      mockGetMe.mockResolvedValue(me)
      const store = useAuthStore()
      await store.fetchUser()
      expect(store.isEmployee).toBe(true)
      expect(store.isCustomer).toBe(false)
    })

    it('isCustomer is true when user_type is CUSTOMER', async () => {
      const me = createMeResponse({ user_type: 'CUSTOMER', customer: 'cust-1' })
      mockGetMe.mockResolvedValue(me)
      const store = useAuthStore()
      await store.fetchUser()
      expect(store.isCustomer).toBe(true)
      expect(store.isEmployee).toBe(false)
    })

    it('needsPolicyAccept is true when acknowledged_bundle_hash differs from current_bundle_hash', async () => {
      const me = createMeResponse({
        acknowledged_bundle_hash: 'old-hash',
        current_bundle_hash: 'new-hash',
      })
      mockGetMe.mockResolvedValue(me)
      const store = useAuthStore()
      await store.fetchUser()
      expect(store.needsPolicyAccept).toBe(true)
    })

    it('needsPolicyAccept is false when hashes match', async () => {
      const me = createMeResponse({
        acknowledged_bundle_hash: 'same-hash',
        current_bundle_hash: 'same-hash',
      })
      mockGetMe.mockResolvedValue(me)
      const store = useAuthStore()
      await store.fetchUser()
      expect(store.needsPolicyAccept).toBe(false)
    })

    it('needsPolicyAccept is false when user is null', () => {
      const store = useAuthStore()
      expect(store.needsPolicyAccept).toBe(false)
    })
  })

  describe('fetchUser', () => {
    it('fetches user and sets state on success', async () => {
      const me = createMeResponse({ username: 'alice' })
      mockGetMe.mockResolvedValue(me)
      const store = useAuthStore()
      const result = await store.fetchUser()
      expect(result).toEqual(me)
      expect(store.user).toEqual(me)
      expect(store.loading).toBe(false)
      expect(mockGetMe).toHaveBeenCalledTimes(1)
    })

    it('clears user and returns null on failure', async () => {
      mockGetMe.mockRejectedValue(new Error('Network error'))
      const store = useAuthStore()
      const result = await store.fetchUser()
      expect(result).toBeNull()
      expect(store.user).toBeNull()
      expect(store.loading).toBe(false)
    })

    it('returns cached user when not forcing refresh and cache is fresh', async () => {
      const me = createMeResponse()
      mockGetMe.mockResolvedValue(me)
      const store = useAuthStore()
      await store.fetchUser()
      expect(mockGetMe).toHaveBeenCalledTimes(1)
      const result = await store.fetchUser()
      expect(result).toEqual(me)
      expect(mockGetMe).toHaveBeenCalledTimes(1)
    })

    it('refetches when forceRefresh is true', async () => {
      const me = createMeResponse()
      mockGetMe.mockResolvedValue(me)
      const store = useAuthStore()
      await store.fetchUser()
      await store.fetchUser(true)
      expect(mockGetMe).toHaveBeenCalledTimes(2)
    })
  })

  describe('clearUser', () => {
    it('clears user and lastFetched', async () => {
      mockGetMe.mockResolvedValue(createMeResponse())
      const store = useAuthStore()
      await store.fetchUser()
      expect(store.user).not.toBeNull()
      store.clearUser()
      expect(store.user).toBeNull()
    })
  })

  describe('updateUser', () => {
    it('merges updates into user', async () => {
      const me = createMeResponse({ email: 'old@example.com' })
      mockGetMe.mockResolvedValue(me)
      const store = useAuthStore()
      await store.fetchUser()
      store.updateUser({ email: 'new@example.com' })
      expect(store.user?.email).toBe('new@example.com')
      expect(store.user?.username).toBe(me.username)
    })

    it('no-ops when user is null', () => {
      const store = useAuthStore()
      store.updateUser({ email: 'x@x.com' })
      expect(store.user).toBeNull()
    })
  })
})
