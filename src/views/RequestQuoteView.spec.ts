import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RequestQuoteView from './RequestQuoteView.vue'
import * as api from '@/api'

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ path: '/request-quote', meta: {} }),
}))

const mockCreateIntakeRequest = vi.spyOn(api, 'createIntakeRequest')

describe('RequestQuoteView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form with asset inventory and submit button', () => {
    const wrapper = mount(RequestQuoteView, {
      global: { stubs: { RouterLink: { template: '<a />' } } },
    })
    expect(wrapper.find('.request-quote-title').text()).toContain('Create Disposal Request')
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    expect(wrapper.find('.request-quote-form').exists()).toBe(true)
  })

  it('shows validation error when submitting without items', async () => {
    const wrapper = mount(RequestQuoteView, {
      global: { stubs: { RouterLink: { template: '<a />' } } },
    })
    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.error-inline').exists()).toBe(true)
    expect(mockCreateIntakeRequest).not.toHaveBeenCalled()
  })

  it('calls createIntakeRequest with items and navigates on valid submit', async () => {
    mockCreateIntakeRequest.mockResolvedValue(undefined as any)
    const wrapper = mount(RequestQuoteView, {
      global: { stubs: { RouterLink: { template: '<a />' } } },
    })
    await wrapper.find('select.type-select').setValue('LAPTOP')
    await wrapper.vm.$nextTick()
    await wrapper.find('button.btn-add-row').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()
    await vi.waitFor(() => {
      expect(mockCreateIntakeRequest).toHaveBeenCalledTimes(1)
    })
    const payload = mockCreateIntakeRequest.mock.calls[0][0]
    expect(payload.items).toBeDefined()
    expect(Array.isArray(payload.items)).toBe(true)
    expect(payload.items).toHaveLength(1)
    expect(payload.items[0].asset_type).toBe('LAPTOP')
    expect(payload.delivery_type).toBe('PICKUP')
    expect(mockPush).toHaveBeenCalledWith('/customer-portal')
  })
})
