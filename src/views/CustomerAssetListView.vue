<template>
  <section class="customer-assets">
    <header class="page-header">
      <h2>My Assets</h2>
      <p class="subtitle">View and search all your assets across all requests</p>
    </header>

    <div class="assets-toolbar">
      <input
        v-model="searchQuery"
        type="search"
        class="search-input"
        placeholder="Search by ID, serial number, model…"
        aria-label="Search assets"
      />
    </div>

    <div class="filters-bar">
      <div class="filters-row">
        <div class="filter-group">
          <select v-model="filters.status" class="filter-select" @change="applyFilters">
            <option value="">All Statuses</option>
            <option value="RECEIVED">Received</option>
            <option value="PENDING_SANITIZATION">Pending Sanitization</option>
            <option value="SANITIZED_PASS">Sanitized (Pass)</option>
            <option value="SANITIZED_FAIL">Sanitized (Fail)</option>
            <option value="DESTROYED">Destroyed</option>
            <option value="RELEASED">Released</option>
          </select>
        </div>
        <div class="filter-group">
          <select v-model="filters.location" class="filter-select" @change="applyFilters">
            <option value="">All Locations</option>
            <option v-for="loc in ASSET_LOCATIONS" :key="loc.value" :value="loc.value">
              {{ loc.label }}
            </option>
          </select>
        </div>
        <div class="filter-group filter-group-date">
          <input
            v-model="filters.createdAfter"
            type="date"
            class="filter-date"
            @change="applyFilters"
          />
          <span class="filter-hint">On or after</span>
        </div>
        <div class="filter-group filter-group-date">
          <input
            v-model="filters.createdBefore"
            type="date"
            class="filter-date"
            @change="applyFilters"
          />
          <span class="filter-hint">On or before</span>
        </div>
        <button
          v-if="hasActiveFilters"
          type="button"
          class="btn-clear-filters"
          @click="clearFilters"
          title="Clear all filters"
          aria-label="Clear all filters"
        >
          ↶
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">Loading assets…</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>
    <div v-else-if="assets.length === 0" class="empty-state">
      <p>No assets found.</p>
      <p v-if="hasActiveFilters" class="empty-hint">Try adjusting your filters.</p>
    </div>
    <div v-else class="assets-table-wrap">
      <table class="assets-table">
        <thead>
          <tr>
            <th>Asset ID</th>
            <th>Manufacturer / Model</th>
            <th>Serial Number</th>
            <th>Status</th>
            <th>Location</th>
            <th>Intake Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="asset in assets"
            :key="asset.id"
            class="asset-row"
            @click="openDetail(asset.id)"
          >
            <td><strong>{{ formatAssetId(asset.id) }}</strong></td>
            <td>{{ asset.manufacturer_model || '—' }}</td>
            <td>{{ asset.serial_number || '—' }}</td>
            <td><span class="badge" :data-status="asset.status">{{ formatStatus(asset.status) }}</span></td>
            <td>{{ getLocationLabel(asset.location) }}</td>
            <td>{{ asset.intake_timestamp ? formatDate(asset.intake_timestamp) : (asset.created_at ? formatDate(asset.created_at) : '—') }}</td>
            <td>
              <button type="button" class="btn-link" @click.stop="openDetail(asset.id)">View</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!loading && assetTotalCount > 0" class="assets-pagination">
      <span class="pagination-info">
        {{ (assetPage - 1) * ASSET_PAGE_SIZE + 1 }}–{{ Math.min(assetPage * ASSET_PAGE_SIZE, assetTotalCount) }} of {{ assetTotalCount }}
      </span>
      <div class="pagination-buttons">
        <button
          type="button"
          class="btn-pagination"
          :disabled="assetPage <= 1"
          @click="goToAssetPage(assetPage - 1)"
        >
          Previous
        </button>
        <button
          type="button"
          class="btn-pagination"
          :disabled="assetPage * ASSET_PAGE_SIZE >= assetTotalCount"
          @click="goToAssetPage(assetPage + 1)"
        >
          Next
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { formatAssetId } from '../utils/format'
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCustomerAssets, ASSET_LOCATIONS, getLocationLabel } from '../api'
import type { AssetSummary } from '../api'

const route = useRoute()
const router = useRouter()

const isEmployeePreview = computed(() => route.path.includes('/employee-portal/customers/'))
const customerId = computed(() => isEmployeePreview.value ? String(route.params.customerId || '') : null)

const ASSET_PAGE_SIZE = 50
const searchQuery = ref('')
const assets = ref<AssetSummary[]>([])
const assetTotalCount = ref(0)
const assetPage = ref(1)
const loading = ref(true)
const error = ref('')
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null
const SEARCH_DEBOUNCE_MS = 400

const filters = reactive({
  status: '',
  location: '',
  createdAfter: '',
  createdBefore: '',
})

const hasActiveFilters = computed(() => {
  return !!(
    filters.status ||
    filters.location ||
    filters.createdAfter ||
    filters.createdBefore
  )
})

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function formatStatus(status: string) {
  return status.replace(/_/g, ' ')
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const params: Parameters<typeof getCustomerAssets>[0] = {
      page: assetPage.value,
      page_size: ASSET_PAGE_SIZE,
    }
    if (filters.status) params.status = filters.status
    if (filters.location) params.location = filters.location
    if (filters.createdAfter) {
      const date = new Date(filters.createdAfter)
      date.setHours(0, 0, 0, 0)
      params.created_after = date.toISOString()
    }
    if (filters.createdBefore) {
      const date = new Date(filters.createdBefore)
      date.setHours(23, 59, 59, 999)
      params.created_before = date.toISOString()
    }
    const q = searchQuery.value.trim()
    if (q) params.search = q
    // For employee preview, pass customer_id
    if (isEmployeePreview.value && customerId.value) {
      params.customer_id = customerId.value
    }

    const res = await getCustomerAssets(params)
    assets.value = res.results
    assetTotalCount.value = res.count
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load assets'
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  loading.value = true
  assetPage.value = 1
  load()
}

function goToAssetPage(p: number) {
  if (p < 1) return
  if ((p - 1) * ASSET_PAGE_SIZE >= assetTotalCount.value) return
  assetPage.value = p
  loading.value = true
  load()
}

function clearFilters() {
  filters.status = ''
  filters.location = ''
  filters.createdAfter = ''
  filters.createdBefore = ''
  assetPage.value = 1
  applyFilters()
}

function openDetail(id: string) {
  const basePath = route.path.includes('/employee-portal/customers/')
    ? `/employee-portal/customers/${String(route.params.customerId || '')}/portal`
    : '/customer-portal'
  const underTracking = route.path.includes('/tracking/')
  const path = underTracking ? `${basePath}/tracking/assets/${id}` : `${basePath}/assets/${id}`
  router.push(path)
}

watch(searchQuery, () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    searchDebounceTimer = null
    assetPage.value = 1
    loading.value = true
    load()
  }, SEARCH_DEBOUNCE_MS)
})

onMounted(() => {
  load()
})
</script>
