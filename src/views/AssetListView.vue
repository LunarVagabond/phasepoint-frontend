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
        v-if="!intakeBatchId"
        type="button"
        class="btn-add-in-header"
        @click="showAddAssetModal = true"
      >
        <span class="add-icon">+</span> Add asset
      </button>
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
      :show-selection="!!intakeBatchId"
      :selected-row-keys="Array.from(selectedAssetIds)"
      @update:selected-row-keys="selectedAssetIds = new Set($event)"
    />

    <div v-if="showAddAssetModal" class="modal-backdrop" @click.self="closeAddAssetModal">
      <div class="modal" @click.stop>
        <h3>Add asset</h3>
        <div class="modal-form">
          <div class="form-row">
            <label>Manufacturer / model</label>
            <input
              v-model="form.manufacturer_model"
              type="text"
              class="text-input"
              placeholder="Manufacturer / model"
            />
          </div>
          <div class="form-row">
            <label>Serial number</label>
            <input
              v-model="form.serial_number"
              type="text"
              class="text-input"
              placeholder="Serial number"
            />
          </div>
          <div class="form-row">
            <label>Customer</label>
            <select v-model="form.customer_id" class="customer-select">
              <option value="">— Customer —</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <p v-if="addError" class="modal-error">{{ addError }}</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="closeAddAssetModal">Cancel</button>
          <button type="button" class="btn-primary" :disabled="submitting" @click="onSubmit">
            {{ submitting ? 'Adding…' : 'Add' }}
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
                />
              </div>
              <div class="form-row">
                <label>Public notes</label>
                <textarea
                  v-model="publicNotes"
                  class="text-input notes-textarea"
                  placeholder="Notes visible to the customer"
                  rows="2"
                />
              </div>
            </div>
          </section>

          <section class="detail-section">
            <h3 class="detail-section-title">Request move</h3>
            <p class="detail-section-desc">Create a custody request to move this asset. The move will be completed when the asset is scanned at the target location (e.g. at a kiosk).</p>
            <div class="request-form">
              <select
                v-model="requestToLocation"
                class="request-select"
                :disabled="detailAsset.location === 'WIPE_STATION' && !!sanitizationResult"
              >
                <option value="">— Select destination —</option>
                <template v-if="detailAsset.location === 'WIPE_STATION' && sanitizationResult">
                  <option v-if="sanitizationResult === 'PASS'" value="CLEAN_CAGE">Clean Cage</option>
                  <option v-if="sanitizationResult === 'FAIL'" value="DESTRUCTION">Destruction</option>
                </template>
                <option v-else v-for="loc in allowedDestinations" :key="loc.value" :value="loc.value">{{ loc.label }}</option>
              </select>
              <div v-if="requestToLocation === 'SHIPPED'" class="form-row">
                <label>Release destination</label>
                <select v-model="releaseDestination" class="request-select">
                  <option value="">— Select —</option>
                  <option value="Re-sale">Re-sale</option>
                  <option value="Recycler">Recycler</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div
                v-if="(detailAsset.location === 'DIRTY_CAGE' || detailAsset.location === 'INTAKE') && requestToLocation === 'DESTRUCTION'"
                class="form-row checkbox-row"
              >
                <label class="checkbox-label">
                  <input v-model="destroyWithoutWipe" type="checkbox" />
                  Destroy without data wipe (record direct-to-destruction)
                </label>
              </div>
              <button
                type="button"
                class="btn-primary"
                :disabled="!canSubmitRequest || requestSubmitting"
                @click="submitRequest"
              >
                {{ requestSubmitting ? 'Submitting…' : 'Request move' }}
              </button>
            </div>
            <p v-if="requestError" class="error-inline">{{ requestError }}</p>
            <p v-if="requestSuccess" class="success-inline">{{ requestSuccess }}</p>
          </section>

          <section class="detail-section">
            <h3 class="detail-section-title">Custody requests</h3>
            <ul v-if="custodyRequests.length" class="request-list">
              <li v-for="req in custodyRequests" :key="req.id" class="request-item">
                <span class="request-item-loc">{{ req.from_location }} → {{ req.to_location }}</span>
                <span class="request-item-status" :class="req.status">{{ req.status }}</span>
                <span class="request-item-meta">{{ formatDate(req.request_timestamp) }}</span>
              </li>
            </ul>
            <p v-else class="modal-muted">No custody requests for this asset.</p>
          </section>

          <section class="detail-section">
            <h3 class="detail-section-title">History (audit log)</h3>
            <ul v-if="assetAuditEvents.length" class="request-list">
              <li v-for="ev in assetAuditEvents" :key="ev.id" class="request-item">
                <span class="request-item-loc">{{ getEventTypeDisplay(ev.event_type) }}</span>
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
import { useRoute } from 'vue-router'
import {
  getAssets,
  getCustomers,
  createAsset,
  getAsset,
  updateAsset,
  getCustodyRequests,
  createCustodyRequest,
  getIntakeBatch,
  getAuditEvents,
  ASSET_LOCATIONS,
} from '../api'
import DataTable from '../components/DataTable.vue'
import { getEventTypeDisplay } from '../api'
import type { AssetSummary, AssetDetail, CustodyRequestSummary, IntakeBatchSummary } from '../api'
import type { DataTableColumn } from '../components/DataTable.vue'

const route = useRoute()

const assetColumns: DataTableColumn[] = [
  { key: 'internal_asset_id', label: 'ID', type: 'strong' },
  { key: 'manufacturer_model', label: 'Manufacturer / model' },
  { key: 'serial_number', label: 'Serial number' },
  { key: 'customer_name', label: 'Customer' },
  { key: 'status', label: 'Status', type: 'badge' },
  { key: 'location', label: 'Location' },
  { key: 'pending_request_display', label: 'Pending move' },
  { key: 'intake_employee_username', label: 'Intake by' },
]

const showAddAssetModal = ref(false)
const searchQuery = ref('')
const assets = ref<AssetSummary[]>([])
const customers = ref<Awaited<ReturnType<typeof getCustomers>>>([])
const loading = ref(true)
const form = reactive({
  manufacturer_model: '',
  serial_number: '',
  customer_id: '' as string | null,
})
const submitting = ref(false)
const addError = ref('')
const lastCreatedId = ref('')

const filteredAssets = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return assets.value
  return assets.value.filter(
    (a) =>
      (a.internal_asset_id && a.internal_asset_id.toLowerCase().includes(q)) ||
      (a.manufacturer_model && a.manufacturer_model.toLowerCase().includes(q)) ||
      (a.serial_number && a.serial_number.toLowerCase().includes(q)) ||
      (a.customer_name && a.customer_name.toLowerCase().includes(q)) ||
      (a.status && a.status.toLowerCase().includes(q)) ||
      (a.location && a.location.toLowerCase().includes(q)) ||
      (a.intake_employee_username && a.intake_employee_username.toLowerCase().includes(q)) ||
      (a.pending_request_display && a.pending_request_display.toLowerCase().includes(q))
  )
})

const detailAssetId = ref<string | null>(null)
const detailAsset = ref<AssetDetail | null>(null)
const detailLoading = ref(false)
const custodyRequests = ref<CustodyRequestSummary[]>([])
const requestToLocation = ref('')
const requestSubmitting = ref(false)
const requestError = ref('')
const requestSuccess = ref('')
const sanitizationResult = ref<'PASS' | 'FAIL' | ''>('')
const sanitizationMethod = ref('')
const sanitizationToolUsed = ref('')
const releaseDestination = ref('')
const destroyWithoutWipe = ref(false)
const internalNotes = ref('')
const publicNotes = ref('')
const notesShowSavedFlash = ref(false)
let notesDebounceTimer: ReturnType<typeof setTimeout> | null = null
const NOTES_DEBOUNCE_MS = 700

const isWipeStation = computed(() => detailAsset.value?.location === 'WIPE_STATION')
const allowedDestinations = computed(() => {
  if (isWipeStation.value) return []
  return ASSET_LOCATIONS
})
const canSubmitRequest = computed(() => {
  if (!requestToLocation.value || requestSubmitting.value) return false
  if (isWipeStation.value && !sanitizationResult.value) return false
  return true
})

const intakeBatchId = computed(() => (route.query.intake_batch as string) || null)
const intakeBatch = ref<IntakeBatchSummary | null>(null)
const assetAuditEvents = ref<Awaited<ReturnType<typeof getAuditEvents>>>([])

const selectedAssetIds = ref<Set<string>>(new Set())
const bulkMoveToLocation = ref('')
const bulkMoveSubmitting = ref(false)
const bulkMoveError = ref('')
const bulkMoveSuccess = ref('')

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

async function load() {
  try {
    const params = intakeBatchId.value ? { intake_batch: intakeBatchId.value } : undefined
    const [assetList, customerList] = await Promise.all([getAssets(params), getCustomers()])
    assets.value = assetList
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

watch(intakeBatchId, () => {
  loading.value = true
  selectedAssetIds.value = new Set()
  bulkMoveError.value = ''
  bulkMoveSuccess.value = ''
  load()
})

async function submitBulkMove() {
  if (selectedAssetIds.value.size === 0 || !bulkMoveToLocation.value) return
  bulkMoveError.value = ''
  bulkMoveSuccess.value = ''
  bulkMoveSubmitting.value = true
  const ids = Array.from(selectedAssetIds.value)
  let ok = 0
  let err = 0
  for (const assetId of ids) {
    try {
      await createCustodyRequest({
        asset_id: assetId,
        to_location: bulkMoveToLocation.value,
        intended_action: 'move',
      })
      ok++
    } catch {
      err++
    }
  }
  bulkMoveSubmitting.value = false
  if (err === 0) {
    bulkMoveSuccess.value = `Move requested for ${ok} asset(s). Complete by scanning at destination.`
    selectedAssetIds.value = new Set()
    await load()
  } else {
    bulkMoveError.value = `${ok} requested, ${err} failed (e.g. transition not allowed).`
    await load()
  }
}

watch(sanitizationResult, (val) => {
  if (detailAsset.value?.location === 'WIPE_STATION') {
    requestToLocation.value = val === 'PASS' ? 'CLEAN_CAGE' : val === 'FAIL' ? 'DESTRUCTION' : ''
  }
})

watch([internalNotes, publicNotes], () => {
  if (!detailAssetId.value) return
  scheduleNotesSave()
})

function openDetail(row: Record<string, unknown>) {
  const id = row.id as string
  if (!id) return
  detailAssetId.value = id
  detailAsset.value = null
  detailLoading.value = true
  custodyRequests.value = []
  requestToLocation.value = ''
  requestError.value = ''
  requestSuccess.value = ''
  sanitizationResult.value = ''
  sanitizationMethod.value = ''
  sanitizationToolUsed.value = ''
  releaseDestination.value = ''
  destroyWithoutWipe.value = false
  internalNotes.value = ''
  publicNotes.value = ''
  notesShowSavedFlash.value = false
  if (notesDebounceTimer) {
    clearTimeout(notesDebounceTimer)
    notesDebounceTimer = null
  }
  loadDetail()
}

async function loadDetail() {
  const id = detailAssetId.value
  if (!id) return
  try {
    const [asset, requests, auditEvents] = await Promise.all([
      getAsset(id),
      getCustodyRequests({ asset_id: id }),
      getAuditEvents({ asset_id: id }),
    ])
    detailAsset.value = asset
    internalNotes.value = asset.internal_notes ?? ''
    publicNotes.value = asset.public_notes ?? ''
    custodyRequests.value = requests
    assetAuditEvents.value = auditEvents
  } catch {
    detailAsset.value = null
    assetAuditEvents.value = []
  } finally {
    detailLoading.value = false
  }
}

function scheduleNotesSave() {
  if (notesDebounceTimer) clearTimeout(notesDebounceTimer)
  notesDebounceTimer = setTimeout(async () => {
    notesDebounceTimer = null
    const id = detailAssetId.value
    if (!id || !detailAsset.value) return
    try {
      const updated = await updateAsset(id, {
        internal_notes: internalNotes.value,
        public_notes: publicNotes.value,
      })
      detailAsset.value = updated
      notesShowSavedFlash.value = true
      setTimeout(() => { notesShowSavedFlash.value = false }, 1500)
    } catch {
      // silent fail or could add non-text feedback later
    }
  }, NOTES_DEBOUNCE_MS)
}

function closeDetail() {
  detailAssetId.value = null
  detailAsset.value = null
  custodyRequests.value = []
  assetAuditEvents.value = []
  requestToLocation.value = ''
  sanitizationResult.value = ''
  sanitizationMethod.value = ''
  sanitizationToolUsed.value = ''
  releaseDestination.value = ''
  destroyWithoutWipe.value = false
  internalNotes.value = ''
  publicNotes.value = ''
  notesShowSavedFlash.value = false
  if (notesDebounceTimer) {
    clearTimeout(notesDebounceTimer)
    notesDebounceTimer = null
  }
}

async function submitRequest() {
  if (!detailAsset.value || !requestToLocation.value) return
  requestError.value = ''
  requestSuccess.value = ''
  requestSubmitting.value = true
  try {
    const payload: Parameters<typeof createCustodyRequest>[0] = {
      asset_id: detailAsset.value.id,
      to_location: requestToLocation.value,
      intended_action: 'move',
    }
    if (detailAsset.value.location === 'WIPE_STATION' && sanitizationResult.value) {
      payload.sanitization_result = sanitizationResult.value
      if (sanitizationMethod.value) payload.sanitization_method = sanitizationMethod.value
      if (sanitizationToolUsed.value) payload.sanitization_tool_used = sanitizationToolUsed.value
    }
    if (requestToLocation.value === 'SHIPPED' && releaseDestination.value) {
      payload.release_destination = releaseDestination.value
    }
    if ((detailAsset.value.location === 'DIRTY_CAGE' || detailAsset.value.location === 'INTAKE') && requestToLocation.value === 'DESTRUCTION' && destroyWithoutWipe.value) {
      payload.destroy_without_wipe = true
    }
    await createCustodyRequest(payload)
    requestSuccess.value = `Move to ${ASSET_LOCATIONS.find((l) => l.value === requestToLocation.value)?.label ?? requestToLocation.value} requested. Complete the move by scanning the asset at the destination.`
    await loadDetail()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create request.'
    try {
      const parsed = JSON.parse(msg)
      if (typeof parsed === 'object' && parsed !== null) {
        const first = Object.values(parsed).flat()[0]
        requestError.value = typeof first === 'string' ? first : msg
      } else {
        requestError.value = msg
      }
    } catch {
      requestError.value = msg
    }
  } finally {
    requestSubmitting.value = false
  }
}

async function onSubmit() {
  addError.value = ''
  lastCreatedId.value = ''
  submitting.value = true
  try {
    const asset = await createAsset({
      manufacturer_model: form.manufacturer_model || undefined,
      serial_number: form.serial_number || undefined,
      customer_id: form.customer_id || null,
    })
    lastCreatedId.value = asset.internal_asset_id
    closeAddAssetModal()
    await load()
  } catch (e) {
    addError.value = e instanceof Error ? e.message : 'Failed to add asset.'
  } finally {
    submitting.value = false
  }
}

function closeAddAssetModal() {
  showAddAssetModal.value = false
  form.manufacturer_model = ''
  form.serial_number = ''
  form.customer_id = null
  addError.value = ''
  lastCreatedId.value = ''
}

onMounted(() => {
  load()
})
</script>

