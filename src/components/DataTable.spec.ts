import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DataTable from './DataTable.vue'

describe('DataTable', () => {
  it('renders columns and data rows', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'value', label: 'Value' },
        ],
        data: [
          { name: 'A', value: 1 },
          { name: 'B', value: 2 },
        ],
      },
    })
    expect(wrapper.find('table.data-table').exists()).toBe(true)
    expect(wrapper.findAll('thead th').length).toBe(2)
    expect(wrapper.findAll('tbody tr.data-row').length).toBe(2)
    expect(wrapper.text()).toContain('A')
    expect(wrapper.text()).toContain('B')
  })

  it('shows loading cell when loading', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: [{ key: 'x', label: 'X' }],
        data: [],
        loading: true,
      },
    })
    expect(wrapper.find('.loading-cell').exists()).toBe(true)
    expect(wrapper.text()).toContain('Loading')
  })
})
