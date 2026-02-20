<template>
  <div class="metrics-filter-bar">
    <div class="filter-row">
      <div class="filter-group">
        <label class="filter-label">Date range</label>
        <div class="time-range-buttons">
          <button
            v-for="range in timeRanges"
            :key="range.value"
            type="button"
            :class="['time-range-btn', { active: filters.dateRange === range.value }]"
            @click="setDateRange(range.value)"
          >
            {{ range.label }}
          </button>
        </div>
      </div>
      <div class="filter-group">
        <label class="filter-label">Customer</label>
        <select
          :value="filters.customer_id ?? ''"
          class="filter-select"
          @change="onCustomerChange($event)"
        >
          <option value="">All customers</option>
          <option v-for="c in customerOptions" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Employee</label>
        <select
          :value="filters.employee_id ?? ''"
          class="filter-select"
          @change="onEmployeeChange($event)"
        >
          <option value="">All employees</option>
          <option v-for="e in employeeOptions" :key="e.id" :value="e.id">{{ e.username }}</option>
        </select>
      </div>
      <div class="filter-group filter-actions">
        <button type="button" class="btn-refresh" @click="$emit('refresh')">Refresh</button>
        <button type="button" class="btn-clear" @click="$emit('clear')">Clear filters</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const timeRanges = [
  { label: '7 Days', value: '7d' as const },
  { label: '30 Days', value: '30d' as const },
  { label: '90 Days', value: '90d' as const },
  { label: '1 Year', value: '1y' as const },
]

interface FilterState {
  dateRange: '7d' | '30d' | '90d' | '1y'
  customer_id?: string
  employee_id?: string
}

const props = defineProps<{
  filters: FilterState
  customerOptions?: Array<{ id: string; name: string }>
  employeeOptions?: Array<{ id: string; username: string }>
}>()

const emit = defineEmits<{
  'update:filters': [partial: Partial<FilterState>]
  refresh: []
  clear: []
}>()

const customerOptions = computed(() => props.customerOptions ?? [])
const employeeOptions = computed(() => props.employeeOptions ?? [])

function setDateRange(value: '7d' | '30d' | '90d' | '1y') {
  emit('update:filters', { dateRange: value })
}

function onCustomerChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:filters', { customer_id: target.value || undefined })
}

function onEmployeeChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:filters', { employee_id: target.value || undefined })
}
</script>

<style scoped lang="scss">
@use '../../styles/variables' as *;

.metrics-filter-bar {
  margin-bottom: $space-4;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: $space-4;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.filter-label {
  font-size: $font-size-sm;
  color: var(--color-text-muted);
  font-weight: 500;
}

.time-range-buttons {
  display: flex;
  gap: $space-2;
  flex-wrap: wrap;
}

.time-range-btn {
  padding: $space-2 $space-3;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  border-radius: $radius-md;
  font-size: $font-size-sm;
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--color-text);

  &:hover {
    background: var(--color-row-hover);
  }

  &.active {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }
}

.filter-select {
  padding: $space-2 $space-3;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: $font-size-base;
  min-width: 160px;
}

.filter-actions {
  flex-direction: row;
  align-items: center;
  gap: $space-2;
}

.btn-refresh,
.btn-clear {
  padding: $space-2 $space-4;
  border-radius: $radius-md;
  font-size: $font-size-sm;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-refresh {
  background: var(--color-primary);
  color: white;
  border: 1px solid var(--color-primary);

  &:hover {
    opacity: 0.9;
  }
}

.btn-clear {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);

  &:hover {
    background: var(--color-background);
  }
}
</style>
