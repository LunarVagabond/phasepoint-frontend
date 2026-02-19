import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterableSelect from './FilterableSelect.vue'

describe('FilterableSelect', () => {
  it('renders trigger with placeholder when no value', () => {
    const wrapper = mount(FilterableSelect, {
      props: {
        modelValue: '',
        options: [
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
        ],
        placeholder: 'Choose one',
      },
    })
    expect(wrapper.find('.filterable-select-trigger').exists()).toBe(true)
    expect(wrapper.find('.trigger-label').text()).toBe('Choose one')
  })

  it('shows selected label when modelValue is set', () => {
    const wrapper = mount(FilterableSelect, {
      props: {
        modelValue: 'a',
        options: [
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
        ],
      },
    })
    expect(wrapper.find('.trigger-label').text()).toBe('Option A')
  })
})
