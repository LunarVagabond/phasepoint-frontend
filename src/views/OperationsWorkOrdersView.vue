<template>
  <div class="operations-work-orders">
    <div class="page-header">
      <h1>Operations - Work Orders</h1>
      <p class="page-description">View all work orders. You can only record sanitization, complete, or generate certificates for work orders assigned to you.</p>
    </div>

    <div class="filters-section">
      <div class="filter-group">
        <label class="toggle-label" for="assigned-to-me-toggle">
          <span class="toggle-text">Assigned to Me</span>
          <input
            id="assigned-to-me-toggle"
            v-model="assignedToMeFilter"
            type="checkbox"
            class="toggle-switch"
            @change="loadWorkOrders"
          />
        </label>
      </div>
      <div class="filter-group">
        <label for="status-filter">Status:</label>
        <select id="status-filter" v-model="statusFilter" class="filter-select" @change="loadWorkOrders">
          <option value="">All</option>
          <option value="CREATED">Created</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="PAUSED">Paused</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
      <div class="filter-group">
        <div class="search-input-wrap">
          <input
            v-model="searchQuery"
            type="search"
            class="filter-input"
            placeholder="Search work order number..."
            aria-label="Search work orders"
            @input="debouncedSearch"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="search-clear-btn"
            aria-label="Clear search"
            @click="searchQuery = ''"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
    </div>

    <DataTable
      :columns="columns"
      :data="filteredWorkOrders"
      :loading="loading"
      row-key="id"
      :row-click="openWorkOrder"
    />
    <p v-if="!loading && filteredWorkOrders.length === 0" class="empty-message">No work orders found.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '../components/DataTable.vue'
import type { DataTableColumn } from '../components/DataTable.vue'
import { getWorkOrders, type WorkOrderSummary } from '../api'
import { useNotifications } from '../composables/useNotifications'

const router = useRouter()

const loading = ref(false)
const workOrders = ref<WorkOrderSummary[]>([])
const statusFilter = ref('')
const assignedToMeFilter = ref(true)
const searchQuery = ref('')

const columns: DataTableColumn[] = [
  { key: 'work_order_number', label: 'Work Order #', type: 'strong' },
  { key: 'status', label: 'Status', type: 'badge' },
  { key: 'assigned_to_username', label: 'Assigned To' },
  { key: 'asset_count', label: 'Assets' },
  { key: 'created_at', label: 'Created' },
]

const filteredWorkOrders = computed(() => {
  let filtered = [...workOrders.value]

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(wo => 
      wo.work_order_number.toLowerCase().includes(query)
    )
  }

  return filtered
})

function openWorkOrder(row: Record<string, unknown>) {
  const id = row.id as string
  if (id) router.push(`/employee-portal/work-orders/${id}`)
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    // Filtering is handled by computed property
  }, 300)
}

async function loadWorkOrders() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (statusFilter.value) params.status = statusFilter.value
    if (assignedToMeFilter.value) params.assigned_to = 'me'
    
    workOrders.value = await getWorkOrders(params)
  } catch (error) {
    const { error: showError } = useNotifications()
    showError('Failed to load work orders')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadWorkOrders()
})
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.operations-work-orders {
  padding: $space-6;
}

.page-header {
  margin-bottom: $space-6;

  h1 {
    font-size: $font-size-2xl;
    font-weight: 600;
    margin-bottom: $space-2;
  }

  .page-description {
    color: var(--color-text-secondary);
    font-size: $font-size-base;
  }
}

.filters-section {
  display: flex;
  gap: $space-4;
  margin-bottom: $space-6;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: $space-1;

  label {
    font-size: $font-size-sm;
    font-weight: 500;
    color: var(--color-text-secondary);
  }
}

.filter-select,
.filter-input {
  padding: $space-2 $space-3;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  font-size: $font-size-sm;
  background: var(--color-background);
  color: var(--color-text);

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: $space-2;
  cursor: pointer;
  user-select: none;
  padding: $space-2 0;
  
  .toggle-text {
    font-size: $font-size-sm;
    font-weight: 500;
    color: var(--color-text-secondary);
  }
  
  &:hover .toggle-text {
    color: var(--color-text);
  }
}

.toggle-switch {
  position: relative;
  width: 2.75rem;
  height: 1.5rem;
  appearance: none;
  background: var(--color-border);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
  
  &::before {
    content: '';
    position: absolute;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    background: white;
    top: 0.125rem;
    left: 0.125rem;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  &:checked {
    background: var(--color-primary);
    
    &::before {
      transform: translateX(1.25rem);
    }
  }
  
  &:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

.filter-input {
  min-width: 250px;
}

.search-input-wrap {
  position: relative;
  display: inline-block;
}

.search-input-wrap .filter-input {
  padding-right: 2.25rem;
}

.search-clear-btn {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background 0.15s;
}

.search-clear-btn:hover {
  color: var(--color-text);
  background: var(--color-border);
}

.empty-message {
  text-align: center;
  padding: $space-8;
  color: var(--color-text-secondary);
  font-size: $font-size-base;
}
</style>
