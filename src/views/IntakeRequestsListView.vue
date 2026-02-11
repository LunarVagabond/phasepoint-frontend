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
        <option value="REJECTED">Rejected</option>
        <option value="COMPLETED">Completed</option>
      </select>
      <input
        v-model="searchQuery"
        type="search"
        class="filter-input"
        placeholder="Search company or request ID…"
        aria-label="Search requests"
      />
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
    alert(e instanceof Error ? e.message : 'Update failed.')
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
    alert(e instanceof Error ? e.message : 'Failed to save note.')
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.intake-requests-list {
  padding: 0;
}

.list-header {
  margin-bottom: $space-6;
}

.list-title {
  font-size: $font-size-2xl;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 $space-2;
}

.list-desc {
  font-size: $font-size-base;
  color: var(--color-text-muted);
  margin: 0;
}

.list-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  margin-bottom: $space-4;
}

.filter-select,
.filter-input {
  padding: $space-2 $space-3;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: $font-size-base;
}

.filter-input {
  min-width: 200px;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.btn-sm {
  padding: $space-1 $space-2;
  font-size: $font-size-sm;
  border-radius: $radius-md;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  cursor: pointer;
}
.btn-seen:hover { background: var(--color-border); }
.btn-accept { border-color: var(--color-success, green); color: var(--color-success, green); }
.btn-accept:hover { background: rgba(34, 197, 94, 0.1); }
.btn-reject { border-color: var(--color-error); color: var(--color-error); }
.btn-reject:hover { background: rgba(239, 68, 68, 0.1); }
.btn-complete:hover { background: var(--color-border); }
.btn-note { color: var(--color-text-muted); }
.btn-note:hover { background: var(--color-border); }

.muted {
  color: var(--color-text-muted);
  margin: $space-4 0 0;
}
</style>
