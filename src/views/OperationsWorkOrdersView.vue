<template>
  <div class="operations-work-orders">
    <div class="page-header">
      <h1>Operations - Work Orders</h1>
      <p class="page-description">View all work orders. You can only record sanitization, complete, or generate certificates for work orders assigned to you.</p>
    </div>

    <div class="filters-section">
      <div class="filter-group">
        <label for="status-filter">Status:</label>
        <select id="status-filter" v-model="statusFilter" class="filter-select" @change="loadWorkOrders">
          <option value="">All</option>
          <option value="CREATED">Created</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="assigned-filter">Assigned To:</label>
        <select id="assigned-filter" v-model="assignedFilter" class="filter-select" @change="loadWorkOrders">
          <option value="">All</option>
          <option value="me">Me</option>
        </select>
      </div>
      <div class="filter-group">
        <input
          v-model="searchQuery"
          type="search"
          class="filter-input"
          placeholder="Search work order number..."
          @input="debouncedSearch"
        />
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
import { getWorkOrders, type WorkOrderSummary } from '../api'

const router = useRouter()

const loading = ref(false)
const workOrders = ref<WorkOrderSummary[]>([])
const statusFilter = ref('')
const assignedFilter = ref('')
const searchQuery = ref('')

const columns = [
  { key: 'work_order_number', label: 'Work Order #', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'assigned_to_username', label: 'Assigned To', sortable: true },
  { key: 'asset_count', label: 'Assets', sortable: true },
  { key: 'created_at', label: 'Created', sortable: true },
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

function openWorkOrder(workOrder: WorkOrderSummary) {
  router.push(`/employee-portal/work-orders/${workOrder.id}`)
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
    if (assignedFilter.value === 'me') params.assigned_to = 'me'
    
    workOrders.value = await getWorkOrders(params)
  } catch (error) {
    console.error('Failed to load work orders:', error)
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

.filter-input {
  min-width: 250px;
}

.empty-message {
  text-align: center;
  padding: $space-8;
  color: var(--color-text-secondary);
  font-size: $font-size-base;
}
</style>
