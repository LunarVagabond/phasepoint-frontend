<template>
  <div class="audit-trail">
    <header class="audit-header">
      <h1 class="audit-title">Audit trail</h1>
      <p class="audit-desc">All recorded events. Click a row to see full details.</p>
    </header>
    <div class="audit-filters">
      <div class="filters-row">
        <div class="filter-group">
          <label class="filter-label">From (time)</label>
          <input
            v-model="filters.timestampAfter"
            type="datetime-local"
            class="filter-input"
            @change="applyFilters"
          />
        </div>
        <div class="filter-group">
          <label class="filter-label">To (time)</label>
          <input
            v-model="filters.timestampBefore"
            type="datetime-local"
            class="filter-input"
            @change="applyFilters"
          />
        </div>
        <div class="filter-group">
          <label class="filter-label">Event type</label>
          <select v-model="filters.eventType" class="filter-select" @change="applyFilters">
            <option value="">All</option>
            <option v-for="(label, value) in AUDIT_EVENT_TYPE_DISPLAY" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Asset ID</label>
          <input
            v-model="filters.assetId"
            type="text"
            class="filter-input"
            placeholder="Asset UUID"
            @change="applyFilters"
          />
        </div>
        <div class="filter-group">
          <label class="filter-label">User</label>
          <input
            v-model="filters.user"
            type="text"
            class="filter-input"
            placeholder="Username"
            @change="applyFilters"
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
      :columns="auditColumns"
      :data="tableData"
      :loading="loading"
      row-key="id"
      :row-click="openDetail"
      :sticky-header="true"
    />
    <div v-if="!loading && totalCount > 0" class="audit-pagination">
      <span class="pagination-info">
        {{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, totalCount) }} of {{ totalCount }}
      </span>
      <div class="pagination-buttons">
        <button
          type="button"
          class="btn-pagination"
          :disabled="page <= 1"
          @click="goToPage(page - 1)"
        >
          Previous
        </button>
        <button
          type="button"
          class="btn-pagination"
          :disabled="page * pageSize >= totalCount"
          @click="goToPage(page + 1)"
        >
          Next
        </button>
      </div>
    </div>

    <div v-if="selectedEvent" class="modal-backdrop" @click.self="selectedEvent = null">
      <div class="modal audit-detail-modal" @click.stop>
        <div class="modal-head">
          <h2 class="modal-title">{{ getAuditEventDisplayText(selectedEvent) }}</h2>
          <button type="button" class="modal-close" aria-label="Close" @click="selectedEvent = null">×</button>
        </div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Time</span>
            <span class="detail-value">{{ formatDate(selectedEvent.timestamp) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Event type</span>
            <span class="detail-value">{{ getAuditEventDisplayText(selectedEvent) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Asset ID</span>
            <span class="detail-value">{{ selectedEvent.asset_id || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">User</span>
            <span class="detail-value">{{ selectedEvent.user_username || selectedEvent.user_id || '—' }}</span>
          </div>
          <div v-if="selectedEvent.work_order_id" class="detail-item">
            <span class="detail-label">Work order ID</span>
            <span class="detail-value">{{ selectedEvent.work_order_id }}</span>
          </div>
          <div v-if="selectedEvent.shipment_id" class="detail-item">
            <span class="detail-label">Shipment ID</span>
            <span class="detail-value">
              <router-link :to="`/employee-portal/shipments/${selectedEvent.shipment_id}`">View shipment</router-link>
              ({{ selectedEvent.shipment_id }})
            </span>
          </div>
          <div class="detail-item full-width">
            <span class="detail-label">Old value</span>
            <pre class="detail-value pre">{{ jsonPreview(selectedEvent.old_value) }}</pre>
          </div>
          <div class="detail-item full-width">
            <span class="detail-label">New value</span>
            <pre class="detail-value pre">{{ jsonPreview(selectedEvent.new_value) }}</pre>
          </div>
          <div class="detail-item full-width">
            <span class="detail-label">Event hash</span>
            <span class="detail-value hash">{{ selectedEvent.event_hash }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="selectedEvent = null">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { getAuditEvents, getAuditEventDisplayText, AUDIT_EVENT_TYPE_DISPLAY } from '../api'
import DataTable from '../components/DataTable.vue'
import type { AuditEventSummary } from '../api'
import type { DataTableColumn } from '../components/DataTable.vue'

const PAGE_SIZE = 25
const loading = ref(true)
const events = ref<AuditEventSummary[]>([])
const totalCount = ref(0)
const page = ref(1)
const pageSize = ref(PAGE_SIZE)
const selectedEvent = ref<AuditEventSummary | null>(null)

const filters = reactive({
  timestampAfter: '' as string,
  timestampBefore: '' as string,
  eventType: '' as string,
  assetId: '' as string,
  user: '' as string,
})

const hasActiveFilters = computed(
  () =>
    !!(
      filters.timestampAfter ||
      filters.timestampBefore ||
      filters.eventType ||
      filters.assetId ||
      filters.user
    )
)

const auditColumns: DataTableColumn[] = [
  { key: 'timestamp_display', label: 'Time', type: 'strong' },
  { key: 'event_type_display', label: 'Event' },
  { key: 'asset_id', label: 'Asset ID' },
  { key: 'user_username', label: 'User' },
]

const tableData = computed(() =>
  events.value.map((e) => ({
    ...e,
    timestamp_display: formatDate(e.timestamp),
    event_type_display: getAuditEventDisplayText(e),
    user_username: e.user_username ?? e.user_id ?? null,
  }))
)

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

/** Convert datetime-local value to ISO string for API (inclusive start). */
function toTimestampAfter(val: string): string | undefined {
  if (!val?.trim()) return undefined
  try {
    const d = new Date(val)
    return isNaN(d.getTime()) ? undefined : d.toISOString()
  } catch {
    return undefined
  }
}

/** Convert datetime-local value to ISO string for API (inclusive end). */
function toTimestampBefore(val: string): string | undefined {
  if (!val?.trim()) return undefined
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return undefined
    d.setSeconds(59, 999)
    return d.toISOString()
  } catch {
    return undefined
  }
}

function jsonPreview(val: unknown) {
  if (val == null) return '—'
  try {
    return typeof val === 'string' ? val : JSON.stringify(val, null, 2)
  } catch {
    return String(val)
  }
}

function openDetail(row: Record<string, unknown>) {
  selectedEvent.value = events.value.find((e) => e.id === row.id) ?? null
}

function applyFilters() {
  page.value = 1
  load()
}

function clearFilters() {
  filters.timestampAfter = ''
  filters.timestampBefore = ''
  filters.eventType = ''
  filters.assetId = ''
  filters.user = ''
  page.value = 1
  load()
}

function goToPage(p: number) {
  if (p < 1) return
  if ((p - 1) * pageSize.value >= totalCount.value) return
  page.value = p
  load()
}

async function load() {
  loading.value = true
  try {
    const params: Parameters<typeof getAuditEvents>[0] = {
      page: page.value,
      page_size: pageSize.value,
    }
    if (filters.timestampAfter) {
      params.timestamp_after = toTimestampAfter(filters.timestampAfter)
    }
    if (filters.timestampBefore) {
      params.timestamp_before = toTimestampBefore(filters.timestampBefore)
    }
    if (filters.eventType) params.event_type = filters.eventType
    if (filters.assetId?.trim()) params.asset_id = filters.assetId.trim()
    if (filters.user?.trim()) params.user = filters.user.trim()
    const res = await getAuditEvents(params)
    events.value = res.results
    totalCount.value = res.count
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

