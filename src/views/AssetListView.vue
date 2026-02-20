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
      <div v-if="selectedAssetIds.size > 0" class="bulk-action-buttons">
        <button
          type="button"
          class="btn-primary"
          @click="showCreateWorkOrderModal = true"
        >
          Create Work Order ({{ selectedAssetIds.size }})
        </button>
        <button
          type="button"
          class="btn-secondary"
          @click="showAddToWorkOrderModal = true"
        >
          Add to Existing Work Order ({{ selectedAssetIds.size }})
        </button>
      </div>
    </div>
    <div class="filters-bar">
      <div class="filters-row">
        <div class="filter-group">
          <FilterableSelect
            v-model="filters.workOrder"
            :options="workOrderFilterOptions"
            placeholder="All Work Orders"
            search-placeholder="Search work orders…"
            class="filter-select"
            @update:modelValue="applyFilters"
          />
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
    <DataTable
      :columns="assetColumns"
      :data="filteredAssets"
      :loading="loading"
      row-key="id"
      :row-click="openDetail"
      :show-selection="true"
      :selected-row-keys="Array.from(selectedAssetIds)"
      :is-row-selectable="isAssetSelectable"
      :sticky-header="true"
      @update:selected-row-keys="handleSelectionUpdate"
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
                <th>ID</th>
                <th>Manufacturer / Model</th>
                <th>Serial Number</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="asset in selectedAssetsList" :key="asset.id">
                <td>{{ formatAssetId(asset.id) }}</td>
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

    <!-- Add to Existing Work Order Modal -->
    <div v-if="showAddToWorkOrderModal" class="modal-backdrop" @click.self="closeAddToWorkOrderModal">
      <div class="modal" @click.stop>
        <h3>Add Assets to Work Order</h3>
        <p class="modal-subtitle">Select a work order to add {{ selectedAssetIds.size }} asset(s) to:</p>
        <div v-if="loadingWorkOrders" class="modal-loading">Loading work orders…</div>
        <div v-else-if="availableWorkOrders.length === 0" class="modal-empty">
          <p>You don't have any open work orders. Create a new work order instead.</p>
        </div>
        <div v-else class="work-order-select-list">
          <div
            v-for="wo in availableWorkOrders"
            :key="wo.id"
            class="work-order-select-item"
            :class="{ selected: selectedWorkOrderId === wo.id }"
            @click="selectedWorkOrderId = wo.id"
          >
            <div class="work-order-select-header">
              <strong>{{ wo.work_order_number }}</strong>
              <span class="badge" :data-status="wo.status">{{ formatWorkOrderStatus(wo.status) }}</span>
            </div>
            <div class="work-order-select-details">
              <span>{{ wo.asset_count }} asset(s)</span>
              <span>•</span>
              <span>Created {{ formatDate(wo.created_at) }}</span>
            </div>
          </div>
        </div>
        <div class="modal-form">
          <div class="work-order-assets-summary">
            <p><strong>{{ selectedAssetIds.size }} asset(s)</strong> will be added to the selected work order.</p>
          </div>
          <p v-if="addToWorkOrderError" class="modal-error">{{ addToWorkOrderError }}</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="closeAddToWorkOrderModal">Cancel</button>
          <button
            type="button"
            class="btn-primary"
            :disabled="!selectedWorkOrderId || addToWorkOrderSubmitting"
            @click="submitAddToWorkOrder"
          >
            {{ addToWorkOrderSubmitting ? 'Adding…' : `Add to Work Order (${selectedAssetIds.size} assets)` }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="detailAssetId" class="drawer-backdrop">
      <div class="drawer asset-detail-drawer" :style="{ top: `${headerHeight}px`, height: `calc(100vh - ${headerHeight}px)` }">
        <template v-if="detailLoading">
          <p class="modal-loading">Loading…</p>
        </template>
        <template v-else-if="detailAsset">
          <div class="drawer-head">
            <h2 class="drawer-title">Asset: {{ formatAssetId(detailAsset.id, true) }}</h2>
            <button type="button" class="drawer-close" aria-label="Close" @click="closeDetail">×</button>
          </div>
          <div class="drawer-content">
          <section class="detail-section detail-section--asset-info">
            <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Manufacturer / Model</span>
              <template v-if="!(detailAsset.manufacturer_model || '').trim()">
                <input
                  v-model="manufacturerModelEdit"
                  type="text"
                  class="text-input detail-identifying-input"
                  placeholder="Enter when empty (one-time set)"
                  :disabled="serialModelSaving"
                />
              </template>
              <span v-else class="detail-value detail-value--locked" title="Locked (set once). Manager can correct via incident.">
                {{ detailAsset.manufacturer_model || '—' }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Serial Number</span>
              <template v-if="!(detailAsset.serial_number || '').trim()">
                <input
                  v-model="serialNumberEdit"
                  type="text"
                  class="text-input detail-identifying-input"
                  placeholder="Enter when empty (one-time set)"
                  :disabled="serialModelSaving"
                />
              </template>
              <span v-else class="detail-value detail-value--locked" title="Locked (set once). Manager can correct via incident.">
                {{ detailAsset.serial_number || '—' }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Customer</span>
              <span class="detail-value">{{ detailAsset.customer_name || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="badge" :data-status="detailAsset.status">{{ detailAsset.status }}</span>
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
          </section>

          <section
            v-if="detailAsset.location === 'WIPE_STATION' || detailAsset.status === 'SANITIZED_PASS' || detailAsset.status === 'SANITIZED_FAIL'"
            class="detail-section detail-section--sanitization"
          >
            <h3 class="detail-section-title">Sanitization Results</h3>
            <p class="detail-section-desc">Read-only. Results are recorded by the external wipe software; our import tool inserts the result record.</p>
            <template v-if="detailAsset.latest_sanitization_record_id">
              <div class="detail-grid sanitization-results-readonly">
                <div class="detail-item">
                  <span class="detail-label">Result</span>
                  <span class="badge" :data-status="detailAsset.latest_sanitization_result === 'PASS' ? 'SANITIZED_PASS' : 'SANITIZED_FAIL'">
                    {{ detailAsset.latest_sanitization_result === 'PASS' ? 'Pass' : 'Fail' }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Method</span>
                  <span class="detail-value">{{ detailAsset.latest_sanitization_method || '—' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Tool used</span>
                  <span class="detail-value">{{ detailAsset.latest_sanitization_tool_used || '—' }}</span>
                </div>
              </div>
            </template>
            <p v-else class="sanitization-no-record">
              No sanitization result recorded yet for this asset. Results are added when the external wipe software generates a report and the import tool inserts the record.
            </p>
          </section>

          <section
            v-if="canSaveSerialModel"
            class="detail-section detail-section--serial-model"
          >
            <h3 class="detail-section-title">Set serial / model</h3>
            <p class="detail-section-desc">You can set empty fields once. After saving, they are locked; a manager can correct via an incident.</p>
            <div class="form-row">
              <button
                type="button"
                class="btn-primary"
                :disabled="serialModelSaving || !hasSerialModelEdit"
                @click="saveSerialModel"
              >
                {{ serialModelSaving ? 'Saving…' : 'Save' }}
              </button>
            </div>
            <p v-if="serialModelSaveError" class="inline-error">{{ serialModelSaveError }}</p>
          </section>

          <section v-if="isManager" class="detail-section detail-section--manager">
            <h3 class="detail-section-title">Correction incidents (manager)</h3>
            <p class="detail-section-desc">Open an incident to authorize a serial/model correction, then update the asset.</p>
            <div class="form-row">
              <button
                type="button"
                class="btn-secondary"
                @click="openIncidentModal"
              >
                Open correction incident
              </button>
            </div>
            <template v-if="assetIncidents.length > 0">
              <h4 class="detail-subsection-title">Update serial/model (authorized by incident)</h4>
              <p v-if="managerUpdateAllowedByReason" class="detail-section-desc">{{ managerUpdateAllowedByReason }}</p>
              <div class="manager-update-form">
                <div v-if="managerCanEditSerial" class="form-row">
                  <label>Serial Number</label>
                  <input
                    v-model="managerSerialEdit"
                    type="text"
                    class="text-input"
                    placeholder="New value"
                    :disabled="managerUpdateSubmitting"
                  />
                </div>
                <div v-if="managerCanEditModel" class="form-row">
                  <label>Manufacturer / Model</label>
                  <input
                    v-model="managerModelEdit"
                    type="text"
                    class="text-input"
                    placeholder="New value"
                    :disabled="managerUpdateSubmitting"
                  />
                </div>
                <button
                  type="button"
                  class="btn-primary"
                  :disabled="managerUpdateSubmitting || !managerHasAllowedEdit"
                  @click="submitManagerUpdate"
                >
                  {{ managerUpdateSubmitting ? 'Saving…' : 'Save correction' }}
                </button>
                <p v-if="managerUpdateError" class="inline-error">{{ managerUpdateError }}</p>
              </div>
            </template>
          </section>

          <section class="detail-section detail-section--notes">
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

          <section class="detail-section detail-section--history">
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
          </div>
        </template>
        <template v-else>
          <div class="drawer-content">
            <p class="modal-muted">Asset not found.</p>
          </div>
        </template>
      </div>
    </div>

    <div v-if="showIncidentModal" class="modal-backdrop" @click.self="closeIncidentModal">
      <div class="modal" @click.stop>
        <div class="modal-head">
          <h2 class="modal-title">Open correction incident</h2>
          <button type="button" class="modal-close" aria-label="Close" @click="closeIncidentModal">×</button>
        </div>
        <p class="modal-desc">Create an incident to authorize correcting this asset’s serial number or make/model. Only managers can then apply the correction.</p>
        <div class="form-row">
          <label>Reason</label>
          <select v-model="incidentReason" class="text-input">
            <option value="">Select…</option>
            <option :value="INCIDENT_REASON.UPDATE_SERIAL_NUMBER">Serial number correction</option>
            <option :value="INCIDENT_REASON.UPDATE_MAKE_MODEL">Make/model correction</option>
            <option :value="INCIDENT_REASON.UPDATE_SERIAL_AND_MODEL">Edit serial and model</option>
          </select>
        </div>
        <div class="form-row">
          <label>Description</label>
          <textarea
            v-model="incidentDescription"
            class="text-input"
            rows="3"
            placeholder="Reason for correction…"
            :disabled="incidentSubmitting"
          />
        </div>
        <p v-if="incidentError" class="inline-error">{{ incidentError }}</p>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="closeIncidentModal">Cancel</button>
          <button
            type="button"
            class="btn-primary"
            :disabled="incidentSubmitting || !incidentReason || !incidentDescription.trim()"
            @click="submitIncidentCreate"
          >
            {{ incidentSubmitting ? 'Creating…' : 'Create incident' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatAssetId } from '../utils/format'
import {
  getAssets,
  getCustomers,
  getAsset,
  updateAsset,
  updateAssetIdentifyingInfo,
  getIntakeBatch,
  getAuditEvents,
  createWorkOrder,
  getWorkOrders,
  getMe,
  addAssetsToWorkOrder,
  createIncident,
  getCustomerAssetIncidents,
  INCIDENT_REASON,
  ASSET_LOCATIONS,
} from '../api'
import type { WorkOrderSummary, CustomerAssetIncident } from '../api'
import DataTable from '../components/DataTable.vue'
import FilterableSelect from '../components/FilterableSelect.vue'
import type { FilterableOption } from '../components/FilterableSelect.vue'
import { getAuditEventDisplayText } from '../api'
import type { AssetSummary, AssetDetail, IntakeBatchSummary } from '../api'
import type { DataTableColumn } from '../components/DataTable.vue'
import { useNotifications } from '../composables/useNotifications'

const route = useRoute()
const router = useRouter()
const { success: showSuccess, error: showError } = useNotifications()

const headerHeight = ref(0)

function updateHeaderHeight() {
  if (typeof document === 'undefined') return
  const header = document.querySelector('.public-site-header, .site-header') as HTMLElement
  if (header) {
    headerHeight.value = header.offsetHeight
  }
}

const assetColumns: DataTableColumn[] = [
  { key: 'id', label: 'ID', type: 'strong', formatter: (val: unknown) => formatAssetId(String(val)) },
  { key: 'manufacturer_model', label: 'Manufacturer / model' },
  { key: 'serial_number', label: 'Serial number' },
  { key: 'customer_name', label: 'Customer' },
  { key: 'intake_timestamp', label: 'Intake date', formatter: (val: unknown) => (val ? formatDate(String(val)) : '—') },
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
  workOrder: 'none', // Default to "No Work Order" so employees see pending items
  status: '',
  location: '',
  customerId: '',
  createdAfter: '',
  createdBefore: '',
})

const allWorkOrders = ref<WorkOrderSummary[]>([]) // For the filter dropdown - shows ALL work orders
const myWorkOrders = ref<WorkOrderSummary[]>([]) // For the "Add to Work Order" modal - shows only user's work orders
const currentUserId = ref<string | null>(null)
const me = ref<Awaited<ReturnType<typeof getMe>> | null>(null)
const isManager = computed(() => (me.value?.groups_display || []).map((g) => g.toLowerCase()).includes('manager'))
const assetIncidents = ref<CustomerAssetIncident[]>([])
const showIncidentModal = ref(false)
const incidentReason = ref<string>('')
const incidentDescription = ref('')
const incidentSubmitting = ref(false)
const incidentError = ref('')
const managerSerialEdit = ref('')
const managerModelEdit = ref('')
const managerUpdateSubmitting = ref(false)
const managerUpdateError = ref('')

const hasActiveFilters = computed(() => {
  return !!(
    (filters.workOrder && filters.workOrder !== 'none') ||
    filters.status ||
    filters.location ||
    filters.customerId ||
    filters.createdAfter ||
    filters.createdBefore
  )
})

const selectedAssetIds = ref<Set<string>>(new Set())

const showCreateWorkOrderModal = ref(false)
const createWorkOrderSubmitting = ref(false)
const createWorkOrderError = ref('')
const showAddToWorkOrderModal = ref(false)
const addToWorkOrderSubmitting = ref(false)
const addToWorkOrderError = ref('')
const selectedWorkOrderId = ref<string | null>(null)
const loadingWorkOrders = ref(false)
const workOrderForm = reactive({
  intended_action: 'MOVE' as 'MOVE' | 'WIPE' | 'DESTROY' | 'QA',
  notes: '',
})

const selectedAssetsList = computed(() => {
  return assets.value.filter((a) => selectedAssetIds.value.has(a.id))
})

function isAssetSelectable(asset: Record<string, unknown>): boolean {
  const status = asset.status as string
  return status !== 'RELEASED' && status !== 'DESTROYED'
}

function handleSelectionUpdate(keys: string[]) {
  // Filter out any non-selectable assets from the selection
  const selectableKeys = keys.filter((id) => {
    const asset = assets.value.find((a) => a.id === id)
    return asset && isAssetSelectable(asset)
  })
  selectedAssetIds.value = new Set(selectableKeys)
}

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
    const q = searchQuery.value.trim()
    const hasSearch = q.length > 0
    if (hasSearch) {
      // When searching, ignore all selectable filters so results match the search (e.g. UUID) regardless of work order, status, etc.
      params.search = q
    } else {
      if (intakeBatchId.value) {
        params.intake_batch = intakeBatchId.value
      }
      if (workOrderId.value) {
        params.work_order = workOrderId.value
      } else if (filters.workOrder) {
        // Handle "none" value for filtering assets without a work order
        params.work_order = filters.workOrder === 'none' ? 'none' : filters.workOrder
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
    }

    const [assetRes, customerList] = await Promise.all([getAssets(params), getCustomers()])
    assets.value = assetRes.results
    assetTotalCount.value = assetRes.count
    customers.value = customerList
    
    // Remove any non-selectable assets from selection
    const selectableIds = new Set(
      Array.from(selectedAssetIds.value).filter((id) => {
        const asset = assets.value.find((a) => a.id === id)
        return asset && isAssetSelectable(asset)
      })
    )
    if (selectableIds.size !== selectedAssetIds.value.size) {
      selectedAssetIds.value = selectableIds
    }
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

async function loadAllWorkOrders() {
  try {
    // Fetch ALL work orders (no assigned_to filter)
    const [createdOrders, inProgressOrders, pausedOrders, completedOrders, cancelledOrders] = await Promise.all([
      getWorkOrders({ status: 'CREATED' }),
      getWorkOrders({ status: 'IN_PROGRESS' }),
      getWorkOrders({ status: 'PAUSED' }),
      getWorkOrders({ status: 'COMPLETED' }),
      getWorkOrders({ status: 'CANCELLED' }),
    ])
    // Combine and deduplicate
    const allOrders = [...createdOrders, ...inProgressOrders, ...pausedOrders, ...completedOrders, ...cancelledOrders]
    const uniqueOrders = Array.from(
      new Map(allOrders.map((wo) => [wo.id, wo])).values()
    )
    allWorkOrders.value = uniqueOrders.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  } catch {
    allWorkOrders.value = []
  }
}

const workOrderFilterOptions = computed<FilterableOption[]>(() => {
  const options: FilterableOption[] = [
    { value: '', label: 'All Work Orders' },
    { value: 'none', label: 'No Work Order' },
  ]
  
  allWorkOrders.value.forEach((wo) => {
    options.push({
      value: wo.id,
      label: `${wo.work_order_number} (${wo.asset_count} assets)`,
    })
  })
  
  return options
})

async function loadMyWorkOrders() {
  if (!currentUserId.value) return
  try {
    // Fetch only the current user's work orders for CREATED, IN_PROGRESS, and PAUSED statuses
    const [createdOrders, inProgressOrders, pausedOrders] = await Promise.all([
      getWorkOrders({ assigned_to: currentUserId.value, status: 'CREATED' }),
      getWorkOrders({ assigned_to: currentUserId.value, status: 'IN_PROGRESS' }),
      getWorkOrders({ assigned_to: currentUserId.value, status: 'PAUSED' }),
    ])
    // Combine and deduplicate
    const allOrders = [...createdOrders, ...inProgressOrders, ...pausedOrders]
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

const availableWorkOrders = computed(() => {
  // Filter out COMPLETED and CANCELLED work orders (for the "Add to Work Order" modal)
  // This uses myWorkOrders (user's work orders only)
  return myWorkOrders.value.filter(
    wo => wo.status !== 'COMPLETED' && wo.status !== 'CANCELLED'
  )
})

function formatWorkOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'CREATED': 'Created',
    'IN_PROGRESS': 'In Progress',
    'PAUSED': 'Paused',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled',
  }
  return statusMap[status] || status
}


function closeAddToWorkOrderModal() {
  showAddToWorkOrderModal.value = false
  selectedWorkOrderId.value = null
  addToWorkOrderError.value = ''
}

async function submitAddToWorkOrder() {
  if (!selectedWorkOrderId.value || selectedAssetIds.value.size === 0) return
  
  addToWorkOrderSubmitting.value = true
  addToWorkOrderError.value = ''
  
  const assetCount = selectedAssetIds.value.size
  const assetIds = Array.from(selectedAssetIds.value)
  
  try {
    await addAssetsToWorkOrder(selectedWorkOrderId.value, assetIds)
    const workOrder = availableWorkOrders.value.find(wo => wo.id === selectedWorkOrderId.value)
    const workOrderNumber = workOrder?.work_order_number || 'work order'
    
    closeAddToWorkOrderModal()
    selectedAssetIds.value = new Set()
    await load()
    
    showSuccess(`Successfully added ${assetCount} asset(s) to ${workOrderNumber}`)
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Failed to add assets to work order'
    addToWorkOrderError.value = errorMessage
    showError(errorMessage)
  } finally {
    addToWorkOrderSubmitting.value = false
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
  filters.workOrder = 'none' // Reset to default "No Work Order"
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

watch(showAddToWorkOrderModal, (isOpen) => {
  if (isOpen) {
    loadWorkOrdersForModal()
  }
})

async function loadWorkOrdersForModal() {
  loadingWorkOrders.value = true
  try {
    await loadMyWorkOrders() // Load only user's work orders for the modal
  } finally {
    loadingWorkOrders.value = false
  }
}

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
  serialNumberEdit.value = ''
  manufacturerModelEdit.value = ''
  serialModelSaveError.value = ''
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
    if (isManager.value && asset.customer_id) {
      try {
        assetIncidents.value = await getCustomerAssetIncidents(id, { customer_id: asset.customer_id })
      } catch {
        assetIncidents.value = []
      }
    } else {
      assetIncidents.value = []
    }
    managerSerialEdit.value = ''
    managerModelEdit.value = ''
    managerUpdateError.value = ''
  } catch {
    detailAsset.value = null
    assetAuditEvents.value = []
    assetIncidents.value = []
  } finally {
    detailLoading.value = false
  }
}

const serialNumberEdit = ref('')
const manufacturerModelEdit = ref('')
const serialModelSaveError = ref('')
const serialModelSaving = ref(false)

const canSaveSerialModel = computed(() => {
  if (!detailAsset.value) return false
  const serialEmpty = !(detailAsset.value.serial_number || '').trim()
  const modelEmpty = !(detailAsset.value.manufacturer_model || '').trim()
  return serialEmpty || modelEmpty
})

const hasSerialModelEdit = computed(() => {
  const s = (serialNumberEdit.value || '').trim()
  const m = (manufacturerModelEdit.value || '').trim()
  if (!detailAsset.value) return false
  const serialEmpty = !(detailAsset.value.serial_number || '').trim()
  const modelEmpty = !(detailAsset.value.manufacturer_model || '').trim()
  return (serialEmpty && s) || (modelEmpty && m)
})

const firstOpenIncident = computed(() => assetIncidents.value.find((i) => i.status === 'open') ?? null)
const managerCanEditSerial = computed(
  () =>
    firstOpenIncident.value &&
    (firstOpenIncident.value.reason === INCIDENT_REASON.UPDATE_SERIAL_NUMBER ||
      firstOpenIncident.value.reason === INCIDENT_REASON.UPDATE_SERIAL_AND_MODEL)
)
const managerCanEditModel = computed(
  () =>
    firstOpenIncident.value &&
    (firstOpenIncident.value.reason === INCIDENT_REASON.UPDATE_MAKE_MODEL ||
      firstOpenIncident.value.reason === INCIDENT_REASON.UPDATE_SERIAL_AND_MODEL)
)
const managerUpdateAllowedByReason = computed(() => {
  const inc = firstOpenIncident.value
  if (!inc) return ''
  if (inc.reason === INCIDENT_REASON.UPDATE_SERIAL_NUMBER) return 'This incident allows only serial number correction.'
  if (inc.reason === INCIDENT_REASON.UPDATE_MAKE_MODEL) return 'This incident allows only make/model correction.'
  if (inc.reason === INCIDENT_REASON.UPDATE_SERIAL_AND_MODEL) return 'This incident allows editing both serial number and make/model.'
  return ''
})
const managerHasAllowedEdit = computed(() => {
  if (managerCanEditSerial.value && (managerSerialEdit.value || '').trim()) return true
  if (managerCanEditModel.value && (managerModelEdit.value || '').trim()) return true
  return false
})

async function saveSerialModel() {
  const id = detailAssetId.value
  if (!id || !detailAsset.value) return
  serialModelSaveError.value = ''
  serialModelSaving.value = true
  try {
    const payload: { serial_number?: string; manufacturer_model?: string } = {}
    const serialEmpty = !(detailAsset.value.serial_number || '').trim()
    const modelEmpty = !(detailAsset.value.manufacturer_model || '').trim()
    if (serialEmpty && (serialNumberEdit.value || '').trim())
      payload.serial_number = (serialNumberEdit.value || '').trim()
    if (modelEmpty && (manufacturerModelEdit.value || '').trim())
      payload.manufacturer_model = (manufacturerModelEdit.value || '').trim()
    if (Object.keys(payload).length === 0) return
    const updated = await updateAsset(id, payload)
    detailAsset.value = updated
    serialNumberEdit.value = ''
    manufacturerModelEdit.value = ''
    await loadDetail()
    showSuccess('Serial / model saved.')
    closeDetail()
  } catch (e) {
    serialModelSaveError.value = e instanceof Error ? e.message : 'Failed to save'
    showError(serialModelSaveError.value)
  } finally {
    serialModelSaving.value = false
  }
}

function openIncidentModal() {
  incidentReason.value = ''
  incidentDescription.value = ''
  incidentError.value = ''
  showIncidentModal.value = true
}

function closeIncidentModal() {
  showIncidentModal.value = false
  incidentError.value = ''
}

async function submitIncidentCreate() {
  const id = detailAssetId.value
  if (!id || !incidentReason.value || !incidentDescription.value.trim()) return
  incidentError.value = ''
  incidentSubmitting.value = true
  try {
    await createIncident({
      asset_id: id,
      reason: incidentReason.value as 'UPDATE_SERIAL_NUMBER' | 'UPDATE_MAKE_MODEL' | 'UPDATE_SERIAL_AND_MODEL',
      description: incidentDescription.value.trim(),
    })
    closeIncidentModal()
    await loadDetail()
    showSuccess('Incident created. You can now update serial/model below.')
  } catch (e) {
    incidentError.value = e instanceof Error ? e.message : 'Failed to create incident'
    showError(incidentError.value)
  } finally {
    incidentSubmitting.value = false
  }
}

async function submitManagerUpdate() {
  const id = detailAssetId.value
  if (!id) return
  const serial = managerSerialEdit.value.trim()
  const model = managerModelEdit.value.trim()
  if (!serial && !model) return
  managerUpdateError.value = ''
  managerUpdateSubmitting.value = true
  try {
    const payload: { serial_number?: string; manufacturer_model?: string } = {}
    if (serial) payload.serial_number = serial
    if (model) payload.manufacturer_model = model
    const updated = await updateAssetIdentifyingInfo(id, payload)
    detailAsset.value = updated
    managerSerialEdit.value = ''
    managerModelEdit.value = ''
    await loadDetail()
    showSuccess('Serial/model updated.')
    closeDetail()
  } catch (e) {
    managerUpdateError.value = e instanceof Error ? e.message : 'Failed to update'
    showError(managerUpdateError.value)
  } finally {
    managerUpdateSubmitting.value = false
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
  assetIncidents.value = []
  internalNotes.value = ''
  publicNotes.value = ''
  loadedInternalNotes.value = ''
  loadedPublicNotes.value = ''
  notesShowSavedFlash.value = false
  serialNumberEdit.value = ''
  manufacturerModelEdit.value = ''
  serialModelSaveError.value = ''
  showIncidentModal.value = false
  incidentError.value = ''
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

let headerObserver: MutationObserver | null = null

onMounted(async () => {
  // Calculate header height
  updateHeaderHeight()
  window.addEventListener('resize', updateHeaderHeight)
  
  // Watch for header changes (e.g., mobile menu open/close)
  headerObserver = new MutationObserver(() => {
    updateHeaderHeight()
  })
  const header = document.querySelector('.public-site-header, .site-header')
  if (header) {
    headerObserver.observe(header, { attributes: true, childList: true, subtree: true })
  }

  // Pre-fill search from URL (e.g. from shipment asset link: ?asset=uuid&search=ASSET-0046)
  const searchFromRoute = route.query.search
  if (searchFromRoute != null && searchFromRoute !== '') {
    searchQuery.value = typeof searchFromRoute === 'string' ? searchFromRoute : searchFromRoute[0] ?? ''
  }

  // Load current user info
  try {
    const userData = await getMe()
    me.value = userData
    currentUserId.value = userData.id
    await loadAllWorkOrders()
  } catch {
    // User info not available, continue without it
  }

  // Sync URL params to filters
  if (workOrderId.value) {
    filters.workOrder = workOrderId.value
  } else if (intakeBatchId.value) {
    // When viewing by intake batch, show all assets in the batch (do not default to "No Work Order")
    filters.workOrder = ''
  } else {
    // Default to "No Work Order" filter when no URL param
    filters.workOrder = 'none'
  }

  load().then(async () => {
    // Open detail panel if asset ID is in query params (e.g., from workflow alert link)
    const assetIdFromRoute = route.query.asset
    if (assetIdFromRoute && typeof assetIdFromRoute === 'string') {
      // Find the asset in the loaded list
      let asset = assets.value.find(a => a.id === assetIdFromRoute)
      if (!asset) {
        // Asset not in current filtered results, fetch it directly
        try {
          asset = await getAsset(assetIdFromRoute)
        } catch {
          // Asset not found or error fetching, skip opening detail
          return
        }
      }
      if (asset) {
        openDetail(asset as Record<string, unknown>)
      }
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateHeaderHeight)
  if (headerObserver) {
    headerObserver.disconnect()
  }
})
</script>

<style scoped lang="scss">
@use '../styles/views/assets';
</style>