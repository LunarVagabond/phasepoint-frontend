<template>
  <div class="audit-trail">
    <header class="audit-header">
      <h1 class="audit-title">Audit trail</h1>
      <p class="audit-desc">All recorded events. Click a row to see full details.</p>
    </header>
    <DataTable
      :columns="auditColumns"
      :data="tableData"
      :loading="loading"
      row-key="id"
      :row-click="openDetail"
    />

    <div v-if="selectedEvent" class="modal-backdrop" @click.self="selectedEvent = null">
      <div class="modal audit-detail-modal" @click.stop>
        <div class="modal-head">
          <h2 class="modal-title">{{ getEventTypeDisplay(selectedEvent.event_type) }}</h2>
          <button type="button" class="modal-close" aria-label="Close" @click="selectedEvent = null">×</button>
        </div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Time</span>
            <span class="detail-value">{{ formatDate(selectedEvent.timestamp) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Event type</span>
            <span class="detail-value">{{ getEventTypeDisplay(selectedEvent.event_type) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Asset ID</span>
            <span class="detail-value">{{ selectedEvent.asset_id || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">User</span>
            <span class="detail-value">{{ selectedEvent.user_username || selectedEvent.user_id || '—' }}</span>
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
import { ref, computed, onMounted } from 'vue'
import { getAuditEvents, getEventTypeDisplay } from '../api'
import DataTable from '../components/DataTable.vue'
import type { AuditEventSummary } from '../api'
import type { DataTableColumn } from '../components/DataTable.vue'

const loading = ref(true)
const events = ref<AuditEventSummary[]>([])
const selectedEvent = ref<AuditEventSummary | null>(null)

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
    event_type_display: getEventTypeDisplay(e.event_type),
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

async function load() {
  try {
    events.value = await getAuditEvents()
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

