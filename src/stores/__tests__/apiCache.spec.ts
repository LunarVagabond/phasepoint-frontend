import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useApiCacheStore } from '../apiCache'
import { createCustomerSummary } from '@/test-utils/factories'
import type { UserSummary, GroupSummary } from '@/api'

const mockGetCustomers = vi.fn()
const mockGetUsers = vi.fn()
const mockGetUsersByType = vi.fn()
const mockGetGroups = vi.fn()
vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>()
  return {
    ...actual,
    getCustomers: (...args: unknown[]) => mockGetCustomers(...args),
    getUsers: (...args: unknown[]) => mockGetUsers(...args),
    getUsersByType: (...args: unknown[]) => mockGetUsersByType(...args),
    getGroups: (...args: unknown[]) => mockGetGroups(...args),
  }
})

const userSummary: UserSummary = {
  id: 'u1',
  username: 'alice',
  email: 'alice@example.com',
  first_name: 'Alice',
  last_name: 'User',
  phone: '',
  is_active: true,
  is_staff: false,
  user_type: 'EMPLOYEE',
  customer: null,
  groups_display: [],
}

const groupSummary: GroupSummary = { id: 1, name: 'operations' }

describe('useApiCacheStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('getCustomers / setCustomers / invalidateCustomers', () => {
    it('getCustomers returns null when cache is empty', () => {
      const store = useApiCacheStore()
      expect(store.getCustomers()).toBeNull()
    })

    it('setCustomers then getCustomers returns data', () => {
      const store = useApiCacheStore()
      const data = [createCustomerSummary()]
      store.setCustomers(data)
      expect(store.getCustomers()).toEqual(data)
    })

    it('invalidateCustomers clears cache', () => {
      const store = useApiCacheStore()
      store.setCustomers([createCustomerSummary()])
      store.invalidateCustomers()
      expect(store.getCustomers()).toBeNull()
    })

    it('getCustomers returns null when TTL expired', () => {
      vi.useFakeTimers()
      const store = useApiCacheStore()
      store.setCustomers([createCustomerSummary()])
      expect(store.getCustomers()).not.toBeNull()
      vi.advanceTimersByTime(3 * 60 * 1000) // past 2 min TTL
      expect(store.getCustomers()).toBeNull()
      vi.useRealTimers()
    })
  })

  describe('getUsers / setUsers / invalidateUsers', () => {
    it('getUsers returns null when cache is empty', () => {
      const store = useApiCacheStore()
      expect(store.getUsers()).toBeNull()
    })

    it('setUsers then getUsers returns data', () => {
      const store = useApiCacheStore()
      const data = [userSummary]
      store.setUsers(data)
      expect(store.getUsers()).toEqual(data)
    })

    it('invalidateUsers clears users and usersByType', () => {
      const store = useApiCacheStore()
      store.setUsers([userSummary])
      store.setUsersByType('EMPLOYEE', [userSummary])
      store.invalidateUsers()
      expect(store.getUsers()).toBeNull()
      expect(store.getUsersByType('EMPLOYEE')).toBeNull()
    })
  })

  describe('getUsersByType / setUsersByType', () => {
    it('getUsersByType returns null when not set', () => {
      const store = useApiCacheStore()
      expect(store.getUsersByType('CUSTOMER')).toBeNull()
    })

    it('setUsersByType then getUsersByType returns data', () => {
      const store = useApiCacheStore()
      const data = [userSummary]
      store.setUsersByType('EMPLOYEE', data)
      expect(store.getUsersByType('EMPLOYEE')).toEqual(data)
    })
  })

  describe('getGroups / setGroups / invalidateGroups', () => {
    it('getGroups returns null when cache is empty', () => {
      const store = useApiCacheStore()
      expect(store.getGroups()).toBeNull()
    })

    it('setGroups then getGroups returns data', () => {
      const store = useApiCacheStore()
      const data = [groupSummary]
      store.setGroups(data)
      expect(store.getGroups()).toEqual(data)
    })

    it('invalidateGroups clears cache', () => {
      const store = useApiCacheStore()
      store.setGroups([groupSummary])
      store.invalidateGroups()
      expect(store.getGroups()).toBeNull()
    })
  })

  describe('clearAll', () => {
    it('clears all caches', () => {
      const store = useApiCacheStore()
      store.setCustomers([createCustomerSummary()])
      store.setUsers([userSummary])
      store.setUsersByType('EMPLOYEE', [userSummary])
      store.setGroups([groupSummary])
      store.clearAll()
      expect(store.getCustomers()).toBeNull()
      expect(store.getUsers()).toBeNull()
      expect(store.getUsersByType('EMPLOYEE')).toBeNull()
      expect(store.getGroups()).toBeNull()
    })
  })

  describe('fetchCustomers', () => {
    it('calls API and sets cache when cache miss', async () => {
      const data = [createCustomerSummary()]
      mockGetCustomers.mockResolvedValue(data)
      const store = useApiCacheStore()
      const result = await store.fetchCustomers()
      expect(result).toEqual(data)
      expect(store.getCustomers()).toEqual(data)
      expect(mockGetCustomers).toHaveBeenCalledTimes(1)
    })

    it('returns cached data when cache hit and not forceRefresh', async () => {
      const data = [createCustomerSummary()]
      const store = useApiCacheStore()
      store.setCustomers(data)
      const result = await store.fetchCustomers()
      expect(result).toEqual(data)
      expect(mockGetCustomers).not.toHaveBeenCalled()
    })

    it('calls API when forceRefresh true even with cache', async () => {
      const data = [createCustomerSummary()]
      mockGetCustomers.mockResolvedValue(data)
      const store = useApiCacheStore()
      store.setCustomers([createCustomerSummary({ name: 'Old' })])
      const result = await store.fetchCustomers(true)
      expect(result).toEqual(data)
      expect(mockGetCustomers).toHaveBeenCalledTimes(1)
    })
  })

  describe('fetchUsers', () => {
    it('calls API and sets cache when cache miss', async () => {
      const data = [userSummary]
      mockGetUsers.mockResolvedValue(data)
      const store = useApiCacheStore()
      const result = await store.fetchUsers()
      expect(result).toEqual(data)
      expect(store.getUsers()).toEqual(data)
      expect(mockGetUsers).toHaveBeenCalledTimes(1)
    })

    it('returns cached data when cache hit', async () => {
      const store = useApiCacheStore()
      const data = [userSummary]
      store.setUsers(data)
      const result = await store.fetchUsers()
      expect(result).toEqual(data)
      expect(mockGetUsers).not.toHaveBeenCalled()
    })
  })

  describe('fetchUsersByType', () => {
    it('calls API and sets cache when cache miss', async () => {
      const data = [userSummary]
      mockGetUsersByType.mockResolvedValue(data)
      const store = useApiCacheStore()
      const result = await store.fetchUsersByType('EMPLOYEE')
      expect(result).toEqual(data)
      expect(store.getUsersByType('EMPLOYEE')).toEqual(data)
      expect(mockGetUsersByType).toHaveBeenCalledWith('EMPLOYEE')
    })
  })

  describe('fetchGroups', () => {
    it('calls API and sets cache when cache miss', async () => {
      const data = [groupSummary]
      mockGetGroups.mockResolvedValue(data)
      const store = useApiCacheStore()
      const result = await store.fetchGroups()
      expect(result).toEqual(data)
      expect(store.getGroups()).toEqual(data)
      expect(mockGetGroups).toHaveBeenCalledTimes(1)
    })
  })
})
