import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import AuthProvider from './AuthProvider.vue'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/api', () => ({
  getMe: vi.fn().mockResolvedValue({
    id: 'u1',
    username: 'user',
    user_type: 'EMPLOYEE',
    groups_display: [],
    current_bundle_hash: 'h',
    acknowledged_bundle_hash: 'h',
    customer: null,
  }),
}))

describe('AuthProvider', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders slot content when not loading', () => {
    const store = useAuthStore()
    store.loading = false
    const wrapper = mount(AuthProvider, {
      slots: { default: '<p class="child">Child</p>' },
    })
    expect(wrapper.find('.child').exists()).toBe(true)
    expect(wrapper.find('.auth-loading').exists()).toBe(false)
  })

  it('renders loading state when loading', async () => {
    const store = useAuthStore()
    store.loading = true
    const wrapper = mount(AuthProvider, {
      slots: { default: '<p class="child">Child</p>' },
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.auth-loading').exists()).toBe(true)
    expect(wrapper.text()).toContain('Loading')
  })
})
