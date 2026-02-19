import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardView from './DashboardView.vue'

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>()
  return {
    ...actual,
    getMe: vi.fn().mockResolvedValue({
      id: 'u1',
      username: 'emp',
      user_type: 'EMPLOYEE',
      groups_display: ['operations'],
      current_bundle_hash: 'h',
      acknowledged_bundle_hash: 'h',
      customer: null,
    }),
    getWorkOrders: vi.fn().mockResolvedValue({ results: [], count: 0 }),
    getUsers: vi.fn().mockResolvedValue([]),
    getUsersByType: vi.fn().mockResolvedValue([]),
    getGroups: vi.fn().mockResolvedValue([]),
    getIntakeRequests: vi.fn().mockResolvedValue([]),
  }
})

vi.mock('@/stores/apiCache', () => ({
  useApiCacheStore: () => ({
    fetchGroups: vi.fn().mockResolvedValue([]),
    getGroups: () => null,
    fetchUsersByType: vi.fn().mockResolvedValue([]),
    fetchCustomers: vi.fn().mockResolvedValue([]),
    getCustomers: () => null,
    invalidateCustomers: vi.fn(),
    invalidateGroups: vi.fn(),
  }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ path: '/', query: {}, meta: {} }),
}))

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard with work orders section', async () => {
    const wrapper = mount(DashboardView, {
      global: { stubs: { RouterLink: { template: '<a />' } } },
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.dashboard').exists()).toBe(true)
    expect(wrapper.find('.section-title').text()).toContain('open work orders')
  })
})
