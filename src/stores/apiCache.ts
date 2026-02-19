import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CustomerSummary, UserSummary, GroupSummary } from '../api'

/**
 * API Cache store - caches frequently-used API responses
 * Provides reactive access to cached data with automatic TTL management
 */
export const useApiCacheStore = defineStore('apiCache', () => {
  // Cache entries with timestamps
  const customers = ref<{ data: CustomerSummary[]; timestamp: number } | null>(null)
  const users = ref<{ data: UserSummary[]; timestamp: number } | null>(null)
  const usersByType = ref<Map<string, { data: UserSummary[]; timestamp: number }>>(new Map())
  const groups = ref<{ data: GroupSummary[]; timestamp: number } | null>(null)

  // Cache TTLs (in milliseconds)
  const TTL = {
    CUSTOMERS: 2 * 60 * 1000, // 2 minutes
    USERS: 2 * 60 * 1000, // 2 minutes
    GROUPS: 10 * 60 * 1000, // 10 minutes
  }

  /**
   * Check if cache entry is still valid
   */
  function isValid(entry: { timestamp: number } | null, ttl: number): boolean {
    if (!entry) return false
    return Date.now() - entry.timestamp < ttl
  }

  /**
   * Get cached customers if valid
   */
  function getCustomers(): CustomerSummary[] | null {
    return isValid(customers.value, TTL.CUSTOMERS) ? customers.value!.data : null
  }

  /**
   * Set cached customers
   */
  function setCustomers(data: CustomerSummary[]) {
    customers.value = { data, timestamp: Date.now() }
  }

  /**
   * Invalidate customers cache
   */
  function invalidateCustomers() {
    customers.value = null
  }

  /**
   * Get cached users if valid
   */
  function getUsers(): UserSummary[] | null {
    return isValid(users.value, TTL.USERS) ? users.value!.data : null
  }

  /**
   * Set cached users
   */
  function setUsers(data: UserSummary[]) {
    users.value = { data, timestamp: Date.now() }
  }

  /**
   * Get cached users by type if valid
   */
  function getUsersByType(userType: string): UserSummary[] | null {
    const entry = usersByType.value.get(userType)
    return entry && isValid(entry, TTL.USERS) ? entry.data : null
  }

  /**
   * Set cached users by type
   */
  function setUsersByType(userType: string, data: UserSummary[]) {
    usersByType.value.set(userType, { data, timestamp: Date.now() })
  }

  /**
   * Invalidate users cache (all variants)
   */
  function invalidateUsers() {
    users.value = null
    usersByType.value.clear()
  }

  /**
   * Get cached groups if valid
   */
  function getGroups(): GroupSummary[] | null {
    return isValid(groups.value, TTL.GROUPS) ? groups.value!.data : null
  }

  /**
   * Set cached groups
   */
  function setGroups(data: GroupSummary[]) {
    groups.value = { data, timestamp: Date.now() }
  }

  /**
   * Invalidate groups cache
   */
  function invalidateGroups() {
    groups.value = null
  }

  /**
   * Clear all caches
   */
  function clearAll() {
    customers.value = null
    users.value = null
    usersByType.value.clear()
    groups.value = null
  }

  /**
   * Fetch customers, using cache if available
   */
  async function fetchCustomers(forceRefresh = false): Promise<CustomerSummary[]> {
    if (!forceRefresh) {
      const cached = getCustomers()
      if (cached) return cached
    }
    const { getCustomers: fetchCustomersApi } = await import('../api')
    const data = await fetchCustomersApi()
    setCustomers(data)
    return data
  }

  /**
   * Fetch users, using cache if available
   */
  async function fetchUsers(forceRefresh = false): Promise<UserSummary[]> {
    if (!forceRefresh) {
      const cached = getUsers()
      if (cached) return cached
    }
    const { getUsers: fetchUsersApi } = await import('../api')
    const data = await fetchUsersApi()
    setUsers(data)
    return data
  }

  /**
   * Fetch users by type, using cache if available
   */
  async function fetchUsersByType(userType: 'EMPLOYEE' | 'CUSTOMER', forceRefresh = false): Promise<UserSummary[]> {
    if (!forceRefresh) {
      const cached = getUsersByType(userType)
      if (cached) return cached
    }
    const { getUsersByType: fetchUsersByTypeApi } = await import('../api')
    const data = await fetchUsersByTypeApi(userType)
    setUsersByType(userType, data)
    return data
  }

  /**
   * Fetch groups, using cache if available
   */
  async function fetchGroups(forceRefresh = false): Promise<GroupSummary[]> {
    if (!forceRefresh) {
      const cached = getGroups()
      if (cached) return cached
    }
    const { getGroups: fetchGroupsApi } = await import('../api')
    const data = await fetchGroupsApi()
    setGroups(data)
    return data
  }

  return {
    // Getters
    getCustomers,
    getUsers,
    getUsersByType,
    getGroups,
    // Setters
    setCustomers,
    setUsers,
    setUsersByType,
    setGroups,
    // Fetch functions (with caching)
    fetchCustomers,
    fetchUsers,
    fetchUsersByType,
    fetchGroups,
    // Invalidation
    invalidateCustomers,
    invalidateUsers,
    invalidateGroups,
    clearAll,
  }
})
