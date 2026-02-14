<template>
  <div class="assets">
    <div v-if="intakeBatch" class="intake-batch-banner">
      <span class="banner-text">Showing intake batch by <strong>{{ intakeBatch.created_by_username }}</strong> on {{ formatDate(intakeBatch.created_at) }} ({{ intakeBatch.asset_count }} assets)</span>
      <router-link to="/employee-portal/assets" class="banner-clear">Show all assets</router-link>
    </div>
    <div class="assets-toolbar">
      <input
        v-model="searchQuery"
        type="search"
        class="search-input"
        placeholder="Search by ID, serial, customer, status, location…"
        aria-label="Search assets"
      />
      <button
        v-if="selectedAssetIds.size > 0"
        type="button"
        class="btn-primary"
        @click="showCreateWorkOrderModal = true"
      >
        Create Work Order ({{ selectedAssetIds.size }})
      </button>
    </div>
    <div class="filters-bar">
      <div class="filters-row">
        <div class="filter-group">
          <select v-model="filters.workOrder" class="filter-select" @change="applyFilters">
            <option value="">All Work Orders</option>
            <option v-for="wo in myWorkOrders" :key="wo.id" :value="wo.id">
              {{ wo.work_order_number }} ({{ wo.asset_count }} assets)
            </option>
          </select>
        </div>
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
        <div class="filter-group">
          <select v-model="filters.customerId" class="filter-select" @change="applyFilters">
            <option value="">All Customers</option>
            <option v-for="cust in customers" :key="cust.id" :value="cust.id">
              {{ cust.name }}
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
    <div v-if="intakeBatchId" class="bulk-actions-bar">
      <label class="bulk-label">Move selected to</label>
      <select v-model="bulkMoveToLocation" class="bulk-select">
        <option value="">— Select destination —</option>
        <option v-for="loc in ASSET_LOCATIONS" :key="loc.value" :value="loc.value">{{ loc.label }}</option>
      </select>
      <button
        type="button"
        class="btn-primary btn-bulk-move"
        :disabled="selectedAssetIds.size === 0 || !bulkMoveToLocation || bulkMoveSubmitting"
        @click="submitBulkMove"
      >
        {{ bulkMoveSubmitting ? 'Submitting…' : 'Request move for selected' }}
      </button>
      <span v-if="selectedAssetIds.size" class="bulk-count">{{ selectedAssetIds.size }} selected</span>
      <span v-if="bulkMoveError" class="error-inline">{{ bulkMoveError }}</span>
      <span v-if="bulkMoveSuccess" class="success-inline">{{ bulkMoveSuccess }}</span>
    </div>
    <DataTable
      :columns="assetColumns"
      :data="filteredAssets"
      :loading="loading"
      row-key="id"
      :row-click="openDetail"
      :show-selection="true"
      :selected-row-keys="Array.from(selectedAssetIds)"
      :sticky-header="true"
      @update:selected-row-keys="selectedAssetIds = new Set($event)"
    />
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

    <div v-if="showCreateWorkOrderModal" class="modal-backdrop" @click.self="closeCreateWorkOrderModal">
      <div class="modal" @click.stop>
        <h3>Create Work Order</h3>
        <p class="modal-subtitle">Confirm the assets to include in this work order:</p>
        <div class="work-order-assets-table">
          <table class="assets-table">
            <thead>
              <tr>
                <th>Internal ID</th>
                <th>Manufacturer / Model</th>
                <th>Serial Number</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="asset in selectedAssetsList" :key="asset.id">
                <td>{{ asset.internal_asset_id }}</td>
                <td>{{ asset.manufacturer_model || '—' }}</td>
                <td>{{ asset.serial_number || '—' }}</td>
                <td>{{ asset.customer_name || '—' }}</td>
                <td>{{ asset.status }}</td>
                <td>{{ asset.location }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-form">
          <div class="form-row">
            <label>Intended Action</label>
            <select v-model="workOrderForm.intended_action" class="text-input">
              <option value="MOVE">Move</option>
              <option value="WIPE">Wipe</option>
              <option value="DESTROY">Destroy</option>
              <option value="QA">QA</option>
            </select>
          </div>
          <div class="form-row">
            <label>Notes (optional)</label>
            <textarea
              v-model="workOrderForm.notes"
              class="text-input"
              rows="3"
              placeholder="Optional notes about this work order"
            />
          </div>
          <p v-if="createWorkOrderError" class="modal-error">{{ createWorkOrderError }}</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="closeCreateWorkOrderModal">Cancel</button>
          <button
            type="button"
            class="btn-primary"
            :disabled="createWorkOrderSubmitting"
            @click="submitCreateWorkOrder"
          >
            {{ createWorkOrderSubmitting ? 'Creating…' : `Create Work Order (${selectedAssetIds.size} assets)` }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="detailAssetId" class="modal-backdrop" @click.self="closeDetail">
      <div class="modal asset-detail-modal" @click.stop>
        <template v-if="detailLoading">
          <p class="modal-loading">Loading…</p>
        </template>
        <template v-else-if="detailAsset">
          <div class="modal-head">
            <h2 class="modal-title">{{ detailAsset.internal_asset_id }}</h2>
            <button type="button" class="modal-close" aria-label="Close" @click="closeDetail">×</button>
          </div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Manufacturer / model</span>
              <span class="detail-value">{{ detailAsset.manufacturer_model || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Serial number</span>
              <span class="detail-value">{{ detailAsset.serial_number || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Customer</span>
              <span class="detail-value">{{ detailAsset.customer_name || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="badge">{{ detailAsset.status }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Location</span>
              <span class="detail-value">{{ detailAsset.location }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Intake</span>
              <span class="detail-value">{{ detailAsset.intake_timestamp ? formatDate(detailAsset.intake_timestamp) : '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Intake by</span>
              <span class="detail-value">{{ detailAsset.intake_employee_username || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Shipment</span>
              <span class="detail-value">
                <template v-if="detailAsset.shipment_id">
                  <router-link :to="`/employee-portal/shipments/${detailAsset.shipment_id}`">View shipment</router-link>
                </template>
                <template v-else>—</template>
              </span>
            </div>
          </div>

          <section v-if="detailAsset.location === 'WIPE_STATION'" class="detail-section">
            <h3 class="detail-section-title">Sanitization result</h3>
            <p class="detail-section-desc">Record the wipe result. Pass → Clean Cage; Fail → Destruction.</p>
            <div class="request-form sanitization-form">
              <div class="form-row">
                <label>Result</label>
                <div class="radio-row">
                  <label class="radio-label">
                    <input v-model="sanitizationResult" type="radio" value="PASS" />
                    Pass
                  </label>
                  <label class="radio-label">
                    <input v-model="sanitizationResult" type="radio" value="FAIL" />
                    Fail
                  </label>
                </div>
              </div>
              <div class="form-row">
                <label>Method (optional)</label>
                <input v-model="sanitizationMethod" type="text" class="text-input" placeholder="e.g. NIST wipe" />
              </div>
              <div class="form-row">
                <label>Tool used (optional)</label>
                <input v-model="sanitizationToolUsed" type="text" class="text-input" placeholder="e.g. Blanco" />
              </div>
              <p class="form-hint">Destination: {{ sanitizationResult === 'PASS' ? 'Clean Cage' : sanitizationResult === 'FAIL' ? 'Destruction' : '—' }}</p>
            </div>
          </section>

          <section class="detail-section">
            <h3 class="detail-section-title">Notes</h3>
            <div class="notes-form" :class="{ 'notes-form--saved': notesShowSavedFlash }">
              <div class="form-row">
                <label>Internal notes</label>
                <textarea
                  v-model="internalNotes"
                  class="text-input notes-textarea"
                  placeholder="Internal notes (not shown to customers)"
                  rows="2"
                  @blur="saveNotesIfChanged"
                />
              </div>
              <div class="form-row">
                <label>Public notes</label>
                <textarea
                  v-model="publicNotes"
                  class="text-input notes-textarea"
                  placeholder="Notes visible to the customer"
                  rows="2"
                  @blur="saveNotesIfChanged"
                />
              </div>
            </div>
          </section>

          <section class="detail-section">
            <h3 class="detail-section-title">History (audit log)</h3>
            <ul v-if="assetAuditEvents.length" class="request-list">
              <li v-for="ev in assetAuditEvents" :key="ev.id" class="request-item">
                <span class="request-item-loc">{{ getAuditEventDisplayText(ev) }}</span>
                <span class="request-item-meta">{{ formatDate(ev.timestamp) }}</span>
              </li>
            </ul>
            <p v-else-if="!detailLoading" class="modal-muted">No audit events for this asset.</p>
            <p v-else class="modal-muted">Loading…</p>
          </section>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeDetail">Close</button>
          </div>
        </template>
        <template v-else>
          <p class="modal-muted">Asset not found.</p>
          <button type="button" class="btn-secondary" @click="closeDetail">Close</button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getAssets,
  getCustomers,
  getAsset,
  updateAsset,
  getIntakeBatch,
  getAuditEvents,
  createWorkOrder,
  getWorkOrders,
  getMe,
  ASSET_LOCATIONS,
} from '../api'
import type { WorkOrderSummary } from '../api'
import DataTable from '../components/DataTable.vue'
import { getAuditEventDisplayText } from '../api'
import type { AssetSummary, AssetDetail, IntakeBatchSummary } from '../api'
import type { DataTableColumn } from '../components/DataTable.vue'

const route = useRoute()
const router = useRouter()

const assetColumns: DataTableColumn[] = [
  { key: 'internal_asset_id', label: 'ID', type: 'strong' },
  { key: 'manufacturer_model', label: 'Manufacturer / model' },
  { key: 'serial_number', label: 'Serial number' },
  { key: 'customer_name', label: 'Customer' },
  { key: 'status', label: 'Status', type: 'badge' },
  { key: 'location', label: 'Location' },
  { key: 'work_order_number', label: 'Work Order' },
  { key: 'intake_employee_username', label: 'Intake by' },
]

const ASSET_PAGE_SIZE = 50
const searchQuery = ref('')
const assets = ref<AssetSummary[]>([])
const assetTotalCount = ref(0)
const assetPage = ref(1)
const customers = ref<Awaited<ReturnType<typeof getCustomers>>>([])
const loading = ref(true)
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null
const SEARCH_DEBOUNCE_MS = 400

const filteredAssets = computed(() => assets.value)

const detailAssetId = ref<string | null>(null)
const detailAsset = ref<AssetDetail | null>(null)
const detailLoading = ref(false)
const internalNotes = ref('')
const publicNotes = ref('')
const notesShowSavedFlash = ref(false)
/** Last loaded/saved values so we only save when user actually changed something. */
const loadedInternalNotes = ref('')
const loadedPublicNotes = ref('')

const intakeBatchId = computed(() => (route.query.intake_batch as string) || null)
const workOrderId = computed(() => (route.query.work_order as string) || null)
const intakeBatch = ref<IntakeBatchSummary | null>(null)
const assetAuditEvents = ref<import('../api').AuditEventSummary[]>([])

const filters = reactive({
  workOrder: '',
  status: '',
  location: '',
  customerId: '',
  createdAfter: '',
  createdBefore: '',
})

const myWorkOrders = ref<WorkOrderSummary[]>([])
const currentUserId = ref<string | null>(null)

const hasActiveFilters = computed(() => {
  return !!(
    filters.workOrder ||
    filters.status ||
    filters.location ||
    filters.customerId ||
    filters.createdAfter ||
    filters.createdBefore
  )
})

const selectedAssetIds = ref<Set<string>>(new Set())
const bulkMoveToLocation = ref('')
const bulkMoveSubmitting = ref(false)
const bulkMoveError = ref('')
const bulkMoveSuccess = ref('')

const showCreateWorkOrderModal = ref(false)
const createWorkOrderSubmitting = ref(false)
const createWorkOrderError = ref('')
const workOrderForm = reactive({
  intended_action: 'MOVE' as 'MOVE' | 'WIPE' | 'DESTROY' | 'QA',
  notes: '',
})

const selectedAssetsList = computed(() => {
  return assets.value.filter((a) => selectedAssetIds.value.has(a.id))
})

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

async function load() {
  try {
    const params: Parameters<typeof getAssets>[0] = {
      page: assetPage.value,
      page_size: ASSET_PAGE_SIZE,
    }
    if (intakeBatchId.value) {
      params.intake_batch = intakeBatchId.value
    }
    if (workOrderId.value) {
      params.work_order = workOrderId.value
    } else if (filters.workOrder) {
      params.work_order = filters.workOrder
    }
    if (filters.status) params.status = filters.status
    if (filters.location) params.location = filters.location
    if (filters.customerId) params.customer_id = filters.customerId
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

    const [assetRes, customerList] = await Promise.all([getAssets(params), getCustomers()])
    assets.value = assetRes.results
    assetTotalCount.value = assetRes.count
    customers.value = customerList
    if (intakeBatchId.value) {
      try {
        intakeBatch.value = await getIntakeBatch(intakeBatchId.value)
      } catch {
        intakeBatch.value = null
      }
    } else {
      intakeBatch.value = null
    }
  } finally {
    loading.value = false
  }
}

async function loadMyWorkOrders() {
  if (!currentUserId.value) return
  try {
    // Fetch work orders for both CREATED and IN_PROGRESS statuses
    const [createdOrders, inProgressOrders] = await Promise.all([
      getWorkOrders({ assigned_to: currentUserId.value, status: 'CREATED' }),
      getWorkOrders({ assigned_to: currentUserId.value, status: 'IN_PROGRESS' }),
    ])
    // Combine and deduplicate
    const allOrders = [...createdOrders, ...inProgressOrders]
    const uniqueOrders = Array.from(
      new Map(allOrders.map((wo) => [wo.id, wo])).values()
    )
    myWorkOrders.value = uniqueOrders.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  } catch {
    myWorkOrders.value = []
  }
}

function applyFilters() {
  loading.value = true
  selectedAssetIds.value = new Set()
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
  filters.workOrder = ''
  filters.status = ''
  filters.location = ''
  filters.customerId = ''
  filters.createdAfter = ''
  filters.createdBefore = ''
  
  // Remove work_order from URL query params if it exists
  if (workOrderId.value) {
    const query = { ...route.query }
    delete query.work_order
    router.replace({ query }).then(() => {
      // After router update, reload with cleared filters
      loading.value = true
      selectedAssetIds.value = new Set()
      load()
    })
  } else {
    assetPage.value = 1
    applyFilters()
  }
}

watch([intakeBatchId, workOrderId], () => {
  loading.value = true
  selectedAssetIds.value = new Set()
  assetPage.value = 1
  bulkMoveError.value = ''
  bulkMoveSuccess.value = ''
  if (workOrderId.value) {
    filters.workOrder = workOrderId.value
  }
  load()
})

watch(searchQuery, () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    searchDebounceTimer = null
    assetPage.value = 1
    loading.value = true
    load()
  }, SEARCH_DEBOUNCE_MS)
})

function openDetail(row: Record<string, unknown>) {
  const id = row.id as string
  if (!id) return
  detailAssetId.value = id
  detailAsset.value = null
  detailLoading.value = true
  internalNotes.value = ''
  publicNotes.value = ''
  loadedInternalNotes.value = ''
  loadedPublicNotes.value = ''
  notesShowSavedFlash.value = false
  loadDetail()
}

async function loadDetail() {
  const id = detailAssetId.value
  if (!id) return
  try {
    const [asset, auditRes] = await Promise.all([
      getAsset(id),
      getAuditEvents({ asset_id: id, page_size: 200 }),
    ])
    detailAsset.value = asset
    const internal = asset.internal_notes ?? ''
    const public_ = asset.public_notes ?? ''
    internalNotes.value = internal
    publicNotes.value = public_
    loadedInternalNotes.value = internal
    loadedPublicNotes.value = public_
    assetAuditEvents.value = auditRes.results
  } catch {
    detailAsset.value = null
    assetAuditEvents.value = []
  } finally {
    detailLoading.value = false
  }
}

/** Save notes only when user has changed them (called on blur). */
async function saveNotesIfChanged() {
  const id = detailAssetId.value
  if (!id || !detailAsset.value) return
  if (
    internalNotes.value === loadedInternalNotes.value &&
    publicNotes.value === loadedPublicNotes.value
  ) return
  try {
    const updated = await updateAsset(id, {
      internal_notes: internalNotes.value,
      public_notes: publicNotes.value,
    })
    detailAsset.value = updated
    loadedInternalNotes.value = internalNotes.value
    loadedPublicNotes.value = publicNotes.value
    notesShowSavedFlash.value = true
    setTimeout(() => { notesShowSavedFlash.value = false }, 1500)
  } catch {
    // silent fail
  }
}

function closeDetail() {
  detailAssetId.value = null
  detailAsset.value = null
  assetAuditEvents.value = []
  internalNotes.value = ''
  publicNotes.value = ''
  loadedInternalNotes.value = ''
  loadedPublicNotes.value = ''
  notesShowSavedFlash.value = false
}

async function submitCreateWorkOrder() {
  if (selectedAssetIds.value.size === 0) return
  createWorkOrderError.value = ''
  createWorkOrderSubmitting.value = true
  try {
    const workOrder = await createWorkOrder({
      asset_ids: Array.from(selectedAssetIds.value),
      intended_action: workOrderForm.intended_action,
      notes: workOrderForm.notes || undefined,
    })
    closeCreateWorkOrderModal()
    selectedAssetIds.value = new Set()
    await load()
    // Show success message or navigate to work order
    alert(`Work order ${workOrder.work_order_number} created successfully!`)
  } catch (e) {
    createWorkOrderError.value = e instanceof Error ? e.message : 'Failed to create work order.'
  } finally {
    createWorkOrderSubmitting.value = false
  }
}

function closeCreateWorkOrderModal() {
  showCreateWorkOrderModal.value = false
  workOrderForm.intended_action = 'MOVE'
  workOrderForm.notes = ''
  createWorkOrderError.value = ''
}

onMounted(async () => {
  // Pre-fill search from URL (e.g. from shipment asset link: ?asset=uuid&search=ASSET-0046)
  const searchFromRoute = route.query.search
  if (searchFromRoute != null && searchFromRoute !== '') {
    searchQuery.value = typeof searchFromRoute === 'string' ? searchFromRoute : searchFromRoute[0] ?? ''
  }

  // Load current user info
  try {
    const me = await getMe()
    currentUserId.value = me.id
    await loadMyWorkOrders()
  } catch {
    // User info not available, continue without it
  }

  // Sync URL params to filters
  if (workOrderId.value) {
    filters.workOrder = workOrderId.value
  }

  load()
})
</script>

