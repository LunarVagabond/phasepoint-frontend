import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getSystemMetrics, type SystemMetricsResponse } from '../api'

export interface SystemMetricsFilters {
  dateRange: '7d' | '30d' | '90d' | '1y'
  created_after?: string
  created_before?: string
  customer_id?: string
  employee_id?: string
  groupBy?: 'employee' | 'date' | 'customer' | 'stage'
}

const CACHE_TTL = 3 * 60 * 1000 // 3 minutes

export const useSystemMetricsStore = defineStore('systemMetrics', () => {
  const metrics = ref<SystemMetricsResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetched = ref<number | null>(null)
  const filters = ref<SystemMetricsFilters>({
    dateRange: '30d',
    groupBy: 'employee',
  })

  const isStale = computed(() => {
    if (!lastFetched.value) return true
    return Date.now() - lastFetched.value > CACHE_TTL
  })

  const kpis = computed(() => metrics.value?.kpis ?? null)
  const operations = computed(() => metrics.value?.operations ?? null)
  const employees = computed(() => metrics.value?.employees ?? [])
  const customers = computed(() => metrics.value?.customers ?? [])
  const trends = computed(() => metrics.value?.trends ?? { daily: [], weekly: [], monthly: [] })
  const compliance = computed(() => metrics.value?.compliance ?? null)
  const alerts = computed(() => metrics.value?.alerts ?? null)

  async function fetchMetrics(forceRefresh = false): Promise<SystemMetricsResponse | null> {
    if (!forceRefresh && metrics.value && lastFetched.value && !isStale.value) {
      return metrics.value
    }

    const f = filters.value
    const now = new Date()
    let created_after: string | undefined
    let created_before: string | undefined
    if (f.dateRange === '7d') {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      created_after = d.toISOString()
    } else if (f.dateRange === '30d') {
      const d = new Date(now)
      d.setDate(d.getDate() - 30)
      created_after = d.toISOString()
    } else if (f.dateRange === '90d') {
      const d = new Date(now)
      d.setDate(d.getDate() - 90)
      created_after = d.toISOString()
    } else if (f.dateRange === '1y') {
      const d = new Date(now)
      d.setFullYear(d.getFullYear() - 1)
      created_after = d.toISOString()
    }
    if (f.created_after) created_after = f.created_after
    if (f.created_before) created_before = f.created_before

    loading.value = true
    error.value = null
    try {
      const data = await getSystemMetrics({
        customer_id: f.customer_id,
        created_after,
        created_before,
        employee_id: f.employee_id,
      })
      metrics.value = data
      lastFetched.value = Date.now()
      return data
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load system metrics'
      return null
    } finally {
      loading.value = false
    }
  }

  function setFilters(newFilters: Partial<SystemMetricsFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function clearFilters() {
    filters.value = {
      dateRange: '30d',
      groupBy: 'employee',
      customer_id: undefined,
      employee_id: undefined,
    }
  }

  function clearCache() {
    metrics.value = null
    lastFetched.value = null
  }

  return {
    metrics,
    loading,
    error,
    filters,
    isStale,
    kpis,
    operations,
    employees,
    customers,
    trends,
    compliance,
    alerts,
    fetchMetrics,
    setFilters,
    clearFilters,
    clearCache,
  }
})
