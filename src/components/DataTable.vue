<template>
  <div class="data-table-wrap" :class="{ 'sticky-header': stickyHeader }">
    <table class="data-table">
      <thead>
        <tr>
          <th v-if="showSelection" class="selection-col">
            <input
              type="checkbox"
              :checked="allSelected"
              :indeterminate="someSelected && !allSelected"
              aria-label="Select all"
              @change="toggleSelectAll"
            />
          </th>
          <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
          <th v-if="$slots['row-actions']" class="actions-col">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="totalColspan" class="loading-cell">Loading…</td>
        </tr>
        <tr
          v-for="(row, i) in data"
          :key="rowKey ? (row[rowKey] as string) : i"
          class="data-row"
          :class="{ 
            'data-row-clickable': !!rowClick,
            'data-row-non-selectable': showSelection && !isRowSelectable(row)
          }"
          @click="rowClick ? rowClick(row) : undefined"
        >
          <td v-if="showSelection" class="selection-col" @click.stop>
            <input
              type="checkbox"
              :checked="selectedRowKeys.includes(String(row[rowKey]))"
              :disabled="!isRowSelectable(row)"
              :aria-label="'Select row ' + (i + 1)"
              @change="toggleRow(row)"
            />
          </td>
          <td v-for="col in columns" :key="col.key">
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
              <template v-if="col.type === 'strong'">
                <strong>{{ col.formatter ? col.formatter(row[col.key]) : formatCell(row[col.key]) }}</strong>
              </template>
              <template v-else-if="col.type === 'badge'">
                <span class="badge" :data-status="String(row[col.key])">{{ col.formatter ? col.formatter(row[col.key]) : formatCell(row[col.key]) }}</span>
              </template>
              <template v-else>
                {{ col.formatter ? col.formatter(row[col.key]) : formatCell(row[col.key]) }}
              </template>
            </slot>
          </td>
          <td v-if="$slots['row-actions']" class="actions-cell">
            <slot name="row-actions" :row="row" />
          </td>
        </tr>
        <slot name="add-row" :colspan="totalColspan" />
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

export interface DataTableColumn {
  key: string
  label: string
  type?: 'text' | 'badge' | 'strong'
  formatter?: (value: unknown) => string
}

const props = withDefaults(
  defineProps<{
    columns: DataTableColumn[]
    data: Record<string, unknown>[]
    loading?: boolean
    rowKey?: string
    rowClick?: (row: Record<string, unknown>) => void
    showSelection?: boolean
    selectedRowKeys?: string[]
    /** Function to determine if a row is selectable. Returns true by default. */
    isRowSelectable?: (row: Record<string, unknown>) => boolean
    /** When true, table header row stays visible when scrolling. */
    stickyHeader?: boolean
  }>(),
  { loading: false, rowKey: 'id', rowClick: undefined, showSelection: false, selectedRowKeys: () => [], isRowSelectable: () => true, stickyHeader: false }
)

const emit = defineEmits<{ (e: 'update:selectedRowKeys', keys: string[]): void }>()
const slots = useSlots()

const totalColspan = computed(
  () => (props.showSelection ? 1 : 0) + props.columns.length + (slots['row-actions'] ? 1 : 0)
)

const selectableRows = computed(() => {
  return props.data.filter((row) => props.isRowSelectable!(row))
})

const allSelected = computed(() => {
  if (!props.showSelection || selectableRows.value.length === 0) return false
  return selectableRows.value.every((row) =>
    props.selectedRowKeys.includes(String(row[props.rowKey]))
  )
})

const someSelected = computed(() => props.selectedRowKeys.length > 0)

function toggleSelectAll() {
  if (!props.showSelection) return
  if (allSelected.value) {
    emit('update:selectedRowKeys', [])
  } else {
    // Only select selectable rows
    const keys = selectableRows.value.map((row) => String(row[props.rowKey])).filter(Boolean)
    emit('update:selectedRowKeys', keys)
  }
}

function toggleRow(row: Record<string, unknown>) {
  if (!props.isRowSelectable!(row)) return
  const key = String(row[props.rowKey])
  if (!key) return
  const set = new Set(props.selectedRowKeys)
  if (set.has(key)) set.delete(key)
  else set.add(key)
  emit('update:selectedRowKeys', Array.from(set))
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '—'
  return String(value)
}
</script>

