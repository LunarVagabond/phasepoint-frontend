<template>
  <div class="workflow-alerts">
    <header class="alerts-header">
      <div>
        <h1 class="alerts-title">Workflow Alerts</h1>
        <p class="alerts-desc">Assets that need attention: stuck in stages or not scanned within expected timeframes.</p>
      </div>
      <div class="alerts-stats">
        <div class="stat-item">
          <span class="stat-label">Open Alerts</span>
          <span class="stat-value open">{{ openAlertsCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total</span>
          <span class="stat-value">{{ alerts.length }}</span>
        </div>
      </div>
    </header>
    <div class="alerts-filters">
      <div class="filters-row">
        <div class="filter-group">
          <label class="filter-label">Status</label>
          <select v-model="filters.openOnly" class="filter-select" @change="loadAlerts">
            <option :value="true">Open only</option>
            <option :value="false">All alerts</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Alert Type</label>
          <select v-model="filters.alertType" class="filter-select" @change="loadAlerts">
            <option value="">All types</option>
            <option value="STUCK_INTAKE">Stuck in Intake</option>
            <option value="STUCK_WIPE">Stuck at Wipe Station</option>
            <option value="NOT_SCANNED">Not Scanned</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">From (time)</label>
          <input
            v-model="filters.createdAfter"
            type="datetime-local"
            class="filter-input"
            @change="loadAlerts"
          />
        </div>
        <div class="filter-group">
          <label class="filter-label">To (time)</label>
          <input
            v-model="filters.createdBefore"
            type="datetime-local"
            class="filter-input"
            @change="loadAlerts"
          />
        </div>
        <button
          v-if="hasActiveFilters"
          type="button"
          class="btn-clear-filters"
          aria-label="Clear filters"
          @click="clearFilters"
        >
          Clear filters
        </button>
      </div>
    </div>
    <DataTable
      :columns="alertColumns"
      :data="filteredAlerts"
      :loading="loading"
      row-key="id"
      :row-click="openAssetDetail"
    />
    <p v-if="!loading && filteredAlerts.length === 0" class="modal-muted">No alerts found.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getWorkflowAlerts, type WorkflowAlert } from '../api'
import DataTable from '../components/DataTable.vue'
import type { DataTableColumn } from '../components/DataTable.vue'

const router = useRouter()

const alertColumns: DataTableColumn[] = [
  { key: 'alert_type', label: 'Type', type: 'badge' },
  { key: 'message', label: 'Message' },
  { key: 'asset_id', label: 'Asset ID', type: 'strong' },
  { key: 'created_at_display', label: 'Created' },
  { key: 'resolved_at_display', label: 'Resolved', type: 'badge' },
]

const alerts = ref<WorkflowAlert[]>([])
const loading = ref(true)
const filters = ref({
  openOnly: true,
  alertType: '',
  createdAfter: '',
  createdBefore: '',
})

const openAlertsCount = computed(() => alerts.value.filter(a => !a.resolved_at).length)

const hasActiveFilters = computed(() => {
  return filters.value.alertType !== '' || filters.value.createdAfter !== '' || filters.value.createdBefore !== ''
})

const filteredAlerts = computed(() => {
  let result = [...alerts.value]
  
  if (filters.value.openOnly) {
    result = result.filter(a => !a.resolved_at)
  }
  
  if (filters.value.alertType) {
    result = result.filter(a => a.alert_type === filters.value.alertType)
  }
  
  if (filters.value.createdAfter) {
    const after = new Date(filters.value.createdAfter)
    result = result.filter(a => new Date(a.created_at) >= after)
  }
  
  if (filters.value.createdBefore) {
    const before = new Date(filters.value.createdBefore)
    result = result.filter(a => new Date(a.created_at) <= before)
  }
  
  return result.map(a => ({
    ...a,
    alert_type: formatAlertType(a.alert_type),
    created_at_display: formatDate(a.created_at),
    resolved_at_display: a.resolved_at ? formatDate(a.resolved_at) : '—',
  }))
})

function formatAlertType(type: string): string {
  const types: Record<string, string> = {
    STUCK_INTAKE: 'Stuck in Intake',
    STUCK_WIPE: 'Stuck at Wipe',
    NOT_SCANNED: 'Not Scanned',
  }
  return types[type] || type
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

async function loadAlerts() {
  loading.value = true
  try {
    const params: {
      created_after?: string
      created_before?: string
      open_only?: boolean
    } = {}
    
    if (filters.value.createdAfter) {
      params.created_after = new Date(filters.value.createdAfter).toISOString()
    }
    if (filters.value.createdBefore) {
      params.created_before = new Date(filters.value.createdBefore).toISOString()
    }
    params.open_only = filters.value.openOnly
    
    alerts.value = await getWorkflowAlerts(params)
  } catch (error) {
    console.error('Failed to load workflow alerts:', error)
    alerts.value = []
  } finally {
    loading.value = false
  }
}

function clearFilters() {
  filters.value = {
    openOnly: true,
    alertType: '',
    createdAfter: '',
    createdBefore: '',
  }
  loadAlerts()
}

function openAssetDetail(row: Record<string, unknown>) {
  const assetId = row.asset_id as string
  if (assetId) {
    router.push({ name: 'Assets', query: { asset: assetId } })
  }
}

onMounted(() => {
  loadAlerts()
})
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.workflow-alerts {
  padding: $space-6;
  max-width: 1400px;
  margin: 0 auto;
}

.alerts-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $space-6;
  flex-wrap: wrap;
  gap: $space-4;
}

.alerts-title {
  margin: 0 0 $space-2;
  font-size: $font-size-2xl;
  font-weight: 600;
  color: var(--color-text);
}

.alerts-desc {
  margin: 0;
  font-size: $font-size-sm;
  color: var(--color-text-muted);
}

.alerts-stats {
  display: flex;
  gap: $space-4;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: $space-1;
}

.stat-label {
  font-size: $font-size-xs;
  color: var(--color-text-muted);
}

.stat-value {
  font-size: $font-size-xl;
  font-weight: 700;
  color: var(--color-primary);
  
  &.open {
    color: var(--color-error, #ef4444);
  }
}

.alerts-filters {
  margin-bottom: $space-4;
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
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

.filter-input,
.filter-select {
  padding: $space-2 $space-3;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: $font-size-base;
  min-width: 180px;
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 37, 99, 235), 0.1);
  }
}

.btn-clear-filters {
  padding: $space-2 $space-4;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  color: var(--color-text);
  font-size: $font-size-sm;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover {
    background: var(--color-background);
    border-color: var(--color-primary);
  }
}
</style>
