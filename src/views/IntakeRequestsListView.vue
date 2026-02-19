<template>
  <div class="intake-requests-list">
    <header class="list-header">
      <h1 class="list-title">Intake requests</h1>
      <p class="list-desc">Review and process incoming requests. Default sort: oldest first.</p>
    </header>
    <div class="list-toolbar">
      <select v-model="statusFilter" class="filter-select" aria-label="Filter by status">
        <option value="">All statuses</option>
        <option value="PENDING">Pending</option>
        <option value="SEEN">Seen</option>
        <option value="ACCEPTED">Accepted</option>
        <option value="PICKING_UP">Picking up</option>
        <option value="RECEIVED">Received</option>
        <option value="REJECTED">Rejected</option>
        <option value="COMPLETED">Completed</option>
      </select>
      <div class="search-input-wrap">
        <input
          v-model="searchQuery"
          type="search"
          class="filter-input"
          placeholder="Search company or request ID…"
          aria-label="Search requests"
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
      <select v-model="ordering" class="filter-select" aria-label="Sort order">
        <option value="">Oldest first</option>
        <option value="-created_at">Newest first</option>
      </select>
    </div>
    <DataTable
      :columns="columns"
      :data="tableData"
      :loading="loading"
      row-key="id"
    >
      <template #row-actions="{ row }">
        <span class="row-actions">
          <button type="button" class="btn-sm btn-note" @click="editInternalNote(row)" title="Internal notes">Note</button>
          <template v-if="(row.status as string) === 'PENDING'">
            <button type="button" class="btn-sm btn-seen" @click="setStatus(row, 'SEEN')">Mark seen</button>
          </template>
          <template v-if="['PENDING', 'SEEN'].includes(row.status as string)">
            <button type="button" class="btn-sm btn-accept" @click="setStatus(row, 'ACCEPTED')">Accept</button>
            <button type="button" class="btn-sm btn-reject" @click="setStatus(row, 'REJECTED')">Reject</button>
          </template>
          <template v-if="(row.status as string) === 'ACCEPTED'">
            <button type="button" class="btn-sm btn-complete" @click="setStatus(row, 'COMPLETED')">Complete</button>
          </template>
        </span>
      </template>
    </DataTable>
    <p v-if="!loading && requests.length === 0" class="muted">No intake requests.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { getIntakeRequests, updateIntakeRequest } from '../api'
import DataTable from '../components/DataTable.vue'
import type { IntakeRequestSummary } from '../api'
import type { DataTableColumn } from '../components/DataTable.vue'
import { useNotifications } from '../composables/useNotifications'

const columns: DataTableColumn[] = [
  { key: 'created_at_display', label: 'Created', type: 'strong' },
  { key: 'customer_name', label: 'Company' },
  { key: 'contact_display', label: 'Contact' },
  { key: 'asset_types_display_str', label: 'Asset types' },
  { key: 'notes_short', label: 'Customer notes' },
  { key: 'status', label: 'Status', type: 'badge' },
]

const loading = ref(true)
const requests = ref<IntakeRequestSummary[]>([])
const statusFilter = ref('')
const searchQuery = ref('')
const ordering = ref('')

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function truncate(s: string, len: number): string {
  if (!s || !s.trim()) return '—'
  const t = s.trim()
  return t.length <= len ? t : t.slice(0, len) + '…'
}

const tableData = computed(() =>
  requests.value.map((r) => ({
    ...r,
    created_at_display: formatDate(r.created_at),
    asset_types_display_str: Array.isArray(r.asset_types_display)
      ? r.asset_types_display.join(', ')
      : (r.asset_types || []).join(', '),
    contact_display: [r.contact_name, r.contact_email].filter(Boolean).join(' — ') || r.contact_email || '—',
    notes_short: truncate(r.notes || '', 50),
  }))
)

function load() {
  loading.value = true
  getIntakeRequests({
    status: statusFilter.value || undefined,
    search: searchQuery.value.trim() || undefined,
    ordering: ordering.value || undefined,
  })
    .then((data) => {
      requests.value = data
    })
    .catch(() => {
      requests.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

watch([statusFilter, searchQuery, ordering], () => {
  load()
})

async function setStatus(row: Record<string, unknown>, status: string) {
  const id = row.id as string
  if (!id) return
  if (status === 'REJECTED' && !confirm('Reject this request?')) return
  try {
    await updateIntakeRequest(id, { status })
    load()
  } catch (e) {
    const { error: showError } = useNotifications()
    showError(e instanceof Error ? e.message : 'Update failed.')
  }
}

async function editInternalNote(row: Record<string, unknown>) {
  const id = row.id as string
  if (!id) return
  const current = (row.internal_notes as string) || ''
  const value = window.prompt('Internal notes (for staff only):', current)
  if (value === null) return
  try {
    await updateIntakeRequest(id, { internal_notes: value })
    load()
  } catch (e) {
    const { error: showError } = useNotifications()
    showError(e instanceof Error ? e.message : 'Failed to save note.')
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
@use '../styles/views/intake-requests-list';
</style>
