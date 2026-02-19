import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AssetListView from './AssetListView.vue'

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>()
  return {
    ...actual,
    getAssets: vi.fn().mockResolvedValue({ results: [], count: 0 }),
    getCustomers: vi.fn().mockResolvedValue([]),
    getWorkOrders: vi.fn().mockResolvedValue([]),
  }
})

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ path: '/', query: {}, params: {}, meta: {} }),
}))

describe('AssetListView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders assets toolbar and filters', async () => {
    const wrapper = mount(AssetListView, {
      global: { stubs: { RouterLink: { template: '<a />' } } },
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.assets').exists()).toBe(true)
    expect(wrapper.find('.assets-toolbar').exists()).toBe(true)
    expect(wrapper.find('.filters-bar').exists()).toBe(true)
  })
})
