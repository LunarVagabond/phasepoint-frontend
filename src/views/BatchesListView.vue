<template>
  <div class="batches">
    <header class="batches-header">
      <h1 class="batches-title">Intake batches</h1>
      <p class="batches-desc">Click a batch to view its assets on the Assets page.</p>
    </header>
    <div class="batches-toolbar">
      <div class="search-input-wrap">
        <input
          v-model="filterQuery"
          type="search"
          class="filter-input"
          placeholder="Filter by batch ID, received by, or date…"
          aria-label="Filter batches"
        />
        <button
          v-if="filterQuery"
          type="button"
          class="search-clear-btn"
          aria-label="Clear search"
          @click="filterQuery = ''"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>
    <DataTable
      :columns="batchColumns"
      :data="filteredTableData"
      :loading="loading"
      row-key="id"
      :row-click="openBatch"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getIntakeBatches } from '../api'
import DataTable from '../components/DataTable.vue'
import type { IntakeBatchSummary } from '../api'
import type { DataTableColumn } from '../components/DataTable.vue'

const router = useRouter()
const loading = ref(true)
const batches = ref<IntakeBatchSummary[]>([])
const filterQuery = ref('')

const batchColumns: DataTableColumn[] = [
  { key: 'id', label: 'Batch ID', type: 'strong' },
  { key: 'created_at_display', label: 'Date' },
  { key: 'created_by_username', label: 'Received by' },
  { key: 'asset_count', label: 'Assets' },
]

const tableData = computed(() =>
  batches.value.map((b) => ({
    ...b,
    created_at_display: formatDate(b.created_at),
  }))
)

const filteredTableData = computed(() => {
  const q = filterQuery.value.trim().toLowerCase()
  if (!q) return tableData.value
  return tableData.value.filter(
    (b) =>
      (b.id && b.id.toLowerCase().includes(q)) ||
      (b.created_by_username && b.created_by_username.toLowerCase().includes(q)) ||
      (b.created_at_display && b.created_at_display.toLowerCase().includes(q))
  )
})

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function openBatch(row: Record<string, unknown>) {
  const id = row.id as string
  if (!id) return
  router.push({ path: '/employee-portal/assets', query: { intake_batch: id } })
}

async function load() {
  try {
    batches.value = await getIntakeBatches()
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

