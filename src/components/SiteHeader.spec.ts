import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import SiteHeader from './SiteHeader.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/', query: {}, meta: { title: 'Test Page' } }),
  useRouter: () => ({ push: vi.fn() }),
}))

describe('SiteHeader', () => {
  it('renders brand and page title', () => {
    const wrapper = mount(SiteHeader, {
      props: { policyOnly: true },
      global: {
        provide: { pageTitle: ref('Test Page') },
        stubs: { RouterLink: { template: '<a href="#"><slot /></a>' } },
      },
    })
    expect(wrapper.find('.site-header').exists()).toBe(true)
    expect(wrapper.find('.page-title').text()).toBe('Test Page')
    expect(wrapper.text()).toContain('Phasepoint')
  })
})
