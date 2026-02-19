import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { useAuth } from '../useAuth'
import { useAuthStore } from '@/stores/auth'
import { createMeResponse } from '@/test-utils/factories'
import { nextTickAndFlush } from '@/test-utils/helpers'

const mockGetMe = vi.fn()
vi.mock('@/api', () => ({
  getMe: (...args: unknown[]) => mockGetMe(...args),
}))

describe('useAuth', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('returns auth store state and methods', () => {
    const TestComp = defineComponent({
      setup() {
        const auth = useAuth()
        return { auth }
      },
      render() {
        const userVal = this.auth?.user != null && typeof this.auth.user === 'object' && 'value' in this.auth.user
          ? (this.auth.user as { value: unknown }).value
          : this.auth?.user
        return h('div', { 'data-user': String(userVal ?? 'null') })
      },
    })
    const wrapper = mount(TestComp)
    expect(wrapper.attributes('data-user')).toBe('null')
  })

  it('auto-fetches user on mount when user is null', async () => {
    const me = createMeResponse({ username: 'test' })
    mockGetMe.mockResolvedValue(me)
    const TestComp = defineComponent({
      setup() {
        useAuth()
        return () => h('div')
      },
    })
    mount(TestComp)
    await nextTickAndFlush()
    expect(mockGetMe).toHaveBeenCalled()
    await nextTickAndFlush()
    const store = useAuthStore()
    expect(store.user?.username).toBe('test')
  })

  it('exposes isAuthenticated, isEmployee, isCustomer from store', async () => {
    const me = createMeResponse({ user_type: 'EMPLOYEE' })
    mockGetMe.mockResolvedValue(me)
    const TestComp = defineComponent({
      setup() {
        useAuth()
        return () => h('div')
      },
    })
    mount(TestComp)
    await nextTickAndFlush()
    await nextTickAndFlush()
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(true)
    expect(store.isEmployee).toBe(true)
    expect(store.isCustomer).toBe(false)
  })
})
