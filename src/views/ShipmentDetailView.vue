<template>
  <div class="shipment-detail">
    <div v-if="loading" class="loading">Loading…</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="shipment" class="shipment-content">
      <header class="page-header">
        <button type="button" class="btn-back" @click="$router.push('/employee-portal/shipments')">← Shipments</button>
        <h1>Shipment {{ shipment.tracking_number || shipment.id.slice(0, 8) }}</h1>
        <p class="meta">Shipped {{ formatDate(shipment.shipped_at) }}</p>
      </header>

      <section class="info-section">
        <div class="info-section-head">
          <h2>Details</h2>
          <button
            v-if="!shipment.assets?.length"
            type="button"
            class="btn-delete-shipment"
            title="Delete empty shipment"
            aria-label="Delete empty shipment"
            :disabled="deleteSubmitting"
            @click="confirmDeleteShipment"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
            <span v-if="deleteSubmitting" class="btn-delete-label">Deleting…</span>
          </button>
        </div>
        <div class="details-form">
          <div class="form-row">
            <label for="detail-carrier">Carrier</label>
            <input
              v-if="editingField === 'carrier'"
              id="detail-carrier"
              ref="carrierInputRef"
              v-model="editCarrier"
              type="text"
              class="text-input"
              placeholder="e.g. FedEx"
              @blur="blurDetailField"
            />
            <div
              v-else
              class="editable-text"
              role="button"
              tabindex="0"
              @click="startEditField('carrier')"
              @keydown.enter.space.prevent="startEditField('carrier')"
            >
              {{ shipment.carrier || '—' }}
            </div>
          </div>
          <div class="form-row">
            <label for="detail-tracking">Tracking number</label>
            <input
              v-if="editingField === 'tracking_number'"
              id="detail-tracking"
              ref="trackingInputRef"
              v-model="editTrackingNumber"
              type="text"
              class="text-input"
              placeholder="Tracking #"
              @blur="blurDetailField"
            />
            <div
              v-else
              class="editable-text"
              role="button"
              tabindex="0"
              @click="startEditField('tracking_number')"
              @keydown.enter.space.prevent="startEditField('tracking_number')"
            >
              {{ shipment.tracking_number || '—' }}
            </div>
          </div>
          <div class="form-row">
            <label for="detail-destination">Destination type</label>
            <select
              v-if="editingField === 'destination_type'"
              id="detail-destination"
              ref="destinationSelectRef"
              v-model="editDestinationType"
              class="text-input"
              @change="saveDetailsOnBlur(); editingField = null"
              @blur="blurDetailField"
            >
              <option value="">—</option>
              <option v-for="d in SHIPMENT_DESTINATION_TYPES" :key="d" :value="d">{{ d }}</option>
            </select>
            <div
              v-else
              class="editable-text"
              role="button"
              tabindex="0"
              @click="startEditField('destination_type')"
              @keydown.enter.space.prevent="startEditField('destination_type')"
            >
              {{ shipment.destination_type || '—' }}
            </div>
          </div>
          <div class="form-row">
            <label for="detail-notes">Notes</label>
            <textarea
              v-if="editingField === 'notes'"
              id="detail-notes"
              ref="notesInputRef"
              v-model="editNotes"
              class="text-input"
              rows="2"
              placeholder="Optional"
              @blur="blurDetailField"
            />
            <div
              v-else
              class="editable-text"
              role="button"
              tabindex="0"
              @click="startEditField('notes')"
              @keydown.enter.space.prevent="startEditField('notes')"
            >
              {{ shipment.notes || '—' }}
            </div>
          </div>
          <div class="details-form-status">
            <p v-if="detailsSaving" class="save-hint">Saving…</p>
            <p v-else-if="detailsError" class="error">{{ detailsError }}</p>
          </div>
        </div>
      </section>

      <section class="assets-section">
        <div class="assets-section-head">
          <h2>Assets in this shipment ({{ shipment.assets?.length ?? 0 }})</h2>
          <button
            type="button"
            class="btn-secondary"
            :disabled="!shipment.assets?.length"
            @click="printShippingManifest"
          >
            Print Shipping Manifest
          </button>
        </div>

        <div class="add-assets-inline">
          <div class="add-asset-group">
            <label class="add-asset-label">Import from work order</label>
            <div class="add-asset-controls">
              <FilterableSelect
                v-model="importWorkOrderId"
                :options="workOrderSelectOptions"
                placeholder="— Select work order —"
                search-placeholder="Search work orders…"
                class="add-asset-select-wrap"
              />
              <button type="button" class="btn-primary" :disabled="!importWorkOrderId || importSubmitting" @click="importFromWorkOrder">
                {{ importSubmitting ? 'Importing…' : 'Import' }}
              </button>
            </div>
          </div>
          <div class="add-asset-group">
            <label class="add-asset-label">Add individual asset</label>
            <div class="add-asset-controls">
              <FilterableSelect
                v-model="addAssetId"
                :options="assetSelectOptions"
                placeholder="— Select asset —"
                search-placeholder="Search assets…"
                class="add-asset-select-wrap"
              />
              <button type="button" class="btn-primary" :disabled="!addAssetId || addSubmitting" @click="addAsset">
                {{ addSubmitting ? 'Adding…' : 'Add' }}
              </button>
            </div>
          </div>
        </div>
        <p v-if="importBlocked.length" class="blocked-alert">
          Asset already on another shipment: {{ importBlocked.map(b => `${b.internal_asset_id} (shipment ${b.shipment_id.slice(0, 8)})`).join(', ') }}. Remove from that shipment first to add here.
        </p>
        <p v-if="addError" class="error">{{ addError }}</p>

        <div v-if="shipment.assets?.length" class="assets-table-block">
          <div class="assets-table-filter-row">
            <label for="asset-table-filter" class="filter-label">Filter assets</label>
            <input
              id="asset-table-filter"
              v-model="assetTableFilter"
              type="text"
              class="text-input assets-filter-input"
              placeholder="Search by ID, serial, status, location…"
            />
          </div>
          <div class="assets-table-wrap">
            <table class="assets-table">
              <thead>
                <tr>
                  <th>Internal ID</th>
                  <th>Serial</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="asset in filteredShipmentAssets" :key="asset.id">
                  <td><router-link :to="`/employee-portal/assets?asset=${asset.id}`">{{ asset.internal_asset_id }}</router-link></td>
                  <td>{{ asset.serial_number || '—' }}</td>
                  <td><span class="badge">{{ asset.status }}</span></td>
                  <td>{{ asset.location }}</td>
                  <td>
                    <button type="button" class="btn-remove" :disabled="removeSubmitting === asset.id" @click="removeAsset(asset.id)">
                      {{ removeSubmitting === asset.id ? '…' : 'Remove' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="filteredShipmentAssets.length === 0" class="filter-empty">No assets match the filter.</p>
        </div>
        <p v-else class="empty-hint">No assets in this shipment yet. Import from a work order or add an asset above.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FilterableSelect from '../components/FilterableSelect.vue'
import {
  getShipment,
  getWorkOrders,
  getAssets,
  addAssetToShipment,
  removeAssetFromShipment,
  importWorkOrderIntoShipment,
  updateShipment,
  deleteShipment,
  SHIPMENT_DESTINATION_TYPES,
  type ShipmentDetail,
  type WorkOrderSummary,
} from '../api'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const shipment = ref<ShipmentDetail | null>(null)
const workOrders = ref<WorkOrderSummary[]>([])
const assetsNotInShipment = ref<{ id: string; internal_asset_id: string; serial_number?: string }[]>([])
const addAssetId = ref('')
const addSubmitting = ref(false)
const addError = ref('')
const removeSubmitting = ref<string | null>(null)
const importWorkOrderId = ref('')
const importSubmitting = ref(false)
const importBlocked = ref<Array<{ internal_asset_id: string; shipment_id: string }>>([])
const assetTableFilter = ref('')
const editCarrier = ref('')
const editTrackingNumber = ref('')
const editDestinationType = ref('')
const editNotes = ref('')
const detailsSaving = ref(false)
const detailsError = ref('')
const deleteSubmitting = ref(false)
const editingField = ref<'carrier' | 'tracking_number' | 'destination_type' | 'notes' | null>(null)
const carrierInputRef = ref<HTMLInputElement | null>(null)
const trackingInputRef = ref<HTMLInputElement | null>(null)
const destinationSelectRef = ref<HTMLSelectElement | null>(null)
const notesInputRef = ref<HTMLTextAreaElement | null>(null)

watch(shipment, (s) => {
  if (s) {
    editCarrier.value = s.carrier ?? ''
    editTrackingNumber.value = s.tracking_number ?? ''
    editDestinationType.value = s.destination_type ?? ''
    editNotes.value = s.notes ?? ''
  }
}, { immediate: true })

const workOrderSelectOptions = computed(() => [
  { value: '', label: '— Select work order —' },
  ...workOrders.value.map((wo) => ({
    value: wo.id,
    label: `${wo.work_order_number} — ${wo.assigned_to_username}`,
  })),
])

const assetSelectOptions = computed(() => [
  { value: '', label: '— Select asset —' },
  ...assetsNotInShipment.value.map((a) => ({
    value: a.id,
    label: `${a.internal_asset_id} (${a.serial_number || 'no serial'})`,
  })),
])

const filteredShipmentAssets = computed(() => {
  const list = shipment.value?.assets ?? []
  const q = assetTableFilter.value.trim().toLowerCase()
  if (!q) return list
  return list.filter((a) => {
    const id = (a.internal_asset_id ?? '').toLowerCase()
    const serial = (a.serial_number ?? '').toLowerCase()
    const status = (a.status ?? '').toLowerCase()
    const location = (a.location ?? '').toLowerCase()
    const customer = (a.customer_name ?? '').toLowerCase()
    const model = (a.manufacturer_model ?? '').toLowerCase()
    return id.includes(q) || serial.includes(q) || status.includes(q) || location.includes(q) || customer.includes(q) || model.includes(q)
  })
})

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function isDetailsDirty(): boolean {
  if (!shipment.value) return false
  const s = shipment.value
  const carrier = editCarrier.value.trim() || undefined
  const tracking = editTrackingNumber.value.trim() || undefined
  const dest = editDestinationType.value.trim() || undefined
  const notes = editNotes.value.trim() || undefined
  return carrier !== (s.carrier ?? undefined) || tracking !== (s.tracking_number ?? undefined) ||
    dest !== (s.destination_type ?? undefined) || notes !== (s.notes ?? undefined)
}

function startEditField(field: 'carrier' | 'tracking_number' | 'destination_type' | 'notes') {
  editingField.value = field
  detailsError.value = ''
  nextTick(() => {
    if (field === 'carrier') carrierInputRef.value?.focus()
    else if (field === 'tracking_number') trackingInputRef.value?.focus()
    else if (field === 'destination_type') destinationSelectRef.value?.focus()
    else if (field === 'notes') notesInputRef.value?.focus()
  })
}

function blurDetailField() {
  editingField.value = null
  saveDetailsOnBlur()
}

function csvEscape(val: string): string {
  const s = String(val ?? '')
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

function printShippingManifest() {
  if (!shipment.value?.assets?.length) return
  const rows: string[][] = [
    ['Asset Name', 'Original Customer', 'Internal ID', 'Serial Number', 'Manufacturer / Model'],
    ...shipment.value.assets.map((a) => [
      a.manufacturer_model || a.internal_asset_id || '',
      a.customer_name ?? '',
      a.internal_asset_id ?? '',
      a.serial_number ?? '',
      a.manufacturer_model ?? '',
    ]),
  ]
  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `shipping-manifest-${shipment.value.tracking_number || shipment.value.id.slice(0, 8)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

async function saveDetailsOnBlur() {
  if (!shipment.value || !isDetailsDirty()) return
  detailsSaving.value = true
  detailsError.value = ''
  try {
    const updated = await updateShipment(shipment.value.id, {
      carrier: editCarrier.value.trim() || undefined,
      tracking_number: editTrackingNumber.value.trim() || undefined,
      destination_type: editDestinationType.value.trim() || undefined,
      notes: editNotes.value.trim() || undefined,
    })
    shipment.value = { ...shipment.value, ...updated }
  } catch (e) {
    detailsError.value = e instanceof Error ? e.message : 'Failed to save details'
  } finally {
    detailsSaving.value = false
  }
}

function confirmDeleteShipment() {
  if (!shipment.value || shipment.value.assets?.length) return
  if (!window.confirm('Delete this empty shipment? This cannot be undone.')) return
  deleteSubmitting.value = true
  detailsError.value = ''
  deleteShipment(shipment.value.id)
    .then(() => {
      router.push('/employee-portal/shipments')
    })
    .catch((e) => {
      detailsError.value = e instanceof Error ? e.message : 'Failed to delete shipment'
    })
    .finally(() => {
      deleteSubmitting.value = false
    })
}

async function loadShipment() {
  const id = route.params.id as string
  if (!id) return
  loading.value = true
  error.value = ''
  importBlocked.value = []
  try {
    shipment.value = await getShipment(id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load shipment'
    shipment.value = null
  } finally {
    loading.value = false
  }
}

async function loadWorkOrders() {
  try {
    workOrders.value = await getWorkOrders()
  } catch {
    workOrders.value = []
  }
}

async function loadAssetsNotInShipment() {
  try {
    const list = await getAssets({ not_in_shipment: true })
    assetsNotInShipment.value = list.map(a => ({
      id: a.id,
      internal_asset_id: a.internal_asset_id,
      serial_number: a.serial_number,
    }))
  } catch {
    assetsNotInShipment.value = []
  }
}

async function addAsset() {
  if (!shipment.value || !addAssetId.value) return
  addSubmitting.value = true
  addError.value = ''
  try {
    await addAssetToShipment(shipment.value.id, addAssetId.value)
    addAssetId.value = ''
    await loadShipment()
    await loadAssetsNotInShipment()
  } catch (e) {
    addError.value = e instanceof Error ? e.message : 'Failed to add asset'
  } finally {
    addSubmitting.value = false
  }
}

async function removeAsset(assetId: string) {
  if (!shipment.value) return
  removeSubmitting.value = assetId
  addError.value = ''
  try {
    await removeAssetFromShipment(shipment.value.id, assetId)
    await loadShipment()
    await loadAssetsNotInShipment()
  } catch (e) {
    addError.value = e instanceof Error ? e.message : 'Failed to remove asset'
  } finally {
    removeSubmitting.value = null
  }
}

async function importFromWorkOrder() {
  if (!shipment.value || !importWorkOrderId.value) return
  importSubmitting.value = true
  addError.value = ''
  importBlocked.value = []
  try {
    const result = await importWorkOrderIntoShipment(shipment.value.id, importWorkOrderId.value)
    if (result.blocked.length) {
      importBlocked.value = result.blocked
    }
    await loadShipment()
    await loadAssetsNotInShipment()
  } catch (e) {
    addError.value = e instanceof Error ? e.message : 'Import failed'
  } finally {
    importSubmitting.value = false
  }
}

watch(() => route.params.id, loadShipment, { immediate: false })
onMounted(loadShipment)
watch(shipment, (s) => {
  if (s) {
    loadWorkOrders()
    loadAssetsNotInShipment()
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.shipment-detail {
  padding: $space-6;
  max-width: 900px;
  margin: 0 auto;
}

.loading,
.error {
  padding: $space-4;
}

.error {
  color: var(--color-error);
}

.page-header {
  margin-bottom: $space-6;
}
.page-header .btn-back {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: $font-size-sm;
  margin-bottom: $space-2;
  padding: 0;
}
.page-header h1 {
  font-size: $font-size-2xl;
  font-weight: 600;
  margin: 0 0 $space-2;
}
.page-header .meta {
  color: var(--color-text-muted);
  font-size: $font-size-sm;
  margin: 0;
}

.info-section,
.assets-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: $radius-lg;
  padding: $space-4;
  margin-bottom: $space-6;
}
.info-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  margin-bottom: $space-4;
}
.info-section-head h2 {
  margin: 0;
  font-size: $font-size-lg;
}
.info-section .details-form {
  margin-top: 0;
}
.assets-section h2 {
  margin: 0 0 $space-4;
  font-size: $font-size-lg;
}

.btn-delete-shipment {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1 $space-2;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: $font-size-sm;
}
.btn-delete-shipment:hover:not(:disabled) {
  border-color: var(--color-error);
  color: var(--color-error);
}
.btn-delete-shipment:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-delete-label {
  margin-left: $space-1;
}
.subsection-title {
  font-size: $font-size-base;
  font-weight: 600;
  margin: 0 0 $space-2;
}

.details-form {
  max-width: 400px;
}
.details-form .form-row {
  margin-bottom: $space-3;
}
.details-form .form-row label {
  display: block;
  font-weight: 500;
  color: var(--color-text-muted);
  margin-bottom: $space-1;
  font-size: $font-size-sm;
}
/* Single-line field height so input and editable-text match (no flicker on blur) */
$detail-field-height: 2.5rem;
.details-form .form-row .editable-text {
  display: block;
  min-height: $detail-field-height;
  padding: $space-2 $space-3;
  border: 1px solid transparent;
  border-radius: $radius-md;
  cursor: pointer;
  font-size: $font-size-base;
  line-height: 1.4;
  white-space: pre-wrap;
  box-sizing: border-box;
}
.details-form .form-row .editable-text:hover {
  background: var(--color-bg-subtle, rgba(0 0 0 / 0.03));
}
.details-form .form-row .editable-text:focus {
  outline: none;
  border-color: var(--color-border);
  background: var(--color-surface);
}
.details-form .form-row input.text-input,
.details-form .form-row select.text-input {
  height: $detail-field-height;
  min-height: $detail-field-height;
  box-sizing: border-box;
}
.details-form .form-row input.text-input,
.details-form .form-row select.text-input,
.details-form .form-row textarea.text-input {
  width: 100%;
  padding: $space-2 $space-3;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  font-size: $font-size-base;
  line-height: 1.4;
}
.details-form .form-row textarea.text-input {
  resize: vertical;
  min-height: $detail-field-height * 1.5;
  height: auto;
}
/* Notes row: keep textarea and editable-text same min height to avoid jump */
.details-form .form-row:last-of-type .editable-text {
  min-height: $detail-field-height * 1.5;
}
.details-form .form-row:last-of-type textarea.text-input {
  min-height: $detail-field-height * 1.5;
}
/* Reserve space for save status so block doesn't jump when "Saving…" appears/disappears */
.details-form-status {
  min-height: 1.75rem;
  margin-top: $space-2;
}
.details-form .save-hint,
.details-form .error {
  margin: 0;
  font-size: $font-size-sm;
}
.details-form .error {
  color: var(--color-error);
}

.assets-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: $space-2;
  margin-bottom: $space-4;
}
.assets-section-head h2 {
  margin: 0;
}
.assets-table-wrap {
  overflow-x: auto;
  margin-bottom: $space-4;
}
.assets-table {
  width: 100%;
  border-collapse: collapse;
}
.assets-table th,
.assets-table td {
  padding: $space-2 $space-3;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}
.assets-table th {
  font-weight: 600;
  color: var(--color-text-muted);
}
.assets-table .badge {
  font-size: $font-size-xs;
  padding: 2px 6px;
  border-radius: $radius-sm;
  background: var(--color-border);
}
.assets-table .btn-remove {
  padding: $space-1 $space-2;
  font-size: $font-size-sm;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  background: var(--color-surface);
  cursor: pointer;
  color: var(--color-text-muted);
}
.assets-table .btn-remove:hover:not(:disabled) {
  border-color: var(--color-error);
  color: var(--color-error);
}

.empty-hint {
  color: var(--color-text-muted);
  font-size: $font-size-sm;
  margin-top: $space-4;
}

.add-assets-inline {
  display: flex;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: $space-6;
  margin-bottom: $space-4;
  background: var(--color-bg-subtle, rgba(0 0 0 / 0.03));
  border: 1px solid var(--color-border);
  border-radius: $radius-lg;
  padding: $space-4;
}
.add-asset-group {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  flex: 1;
  min-width: 0;
}
.add-asset-group:first-child {
  padding-right: $space-6;
  border-right: 1px solid var(--color-border);
  margin-right: 0;
}
.add-asset-label {
  font-size: $font-size-sm;
  font-weight: 500;
  color: var(--color-text-muted);
  margin: 0;
}
.add-asset-controls {
  display: flex;
  align-items: center;
  gap: $space-2;
  min-width: 0;
}
.add-asset-group .add-asset-select-wrap {
  flex: 1;
  min-width: 0;
}
.add-asset-group .btn-primary {
  flex-shrink: 0;
}
@media (max-width: 900px) {
  .add-assets-inline {
    flex-wrap: wrap;
    gap: $space-4;
  }
  .add-asset-group:first-child {
    padding-right: 0;
    padding-bottom: $space-4;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 0;
  }
}

.assets-table-block {
  margin-top: $space-4;
}
.assets-table-filter-row {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-3;
}
.assets-table-filter-row .filter-label {
  font-size: $font-size-sm;
  font-weight: 500;
  color: var(--color-text-muted);
  white-space: nowrap;
}
.assets-filter-input {
  max-width: 320px;
  padding: $space-2 $space-3;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  font-size: $font-size-base;
}
.filter-empty {
  margin-top: $space-2;
  font-size: $font-size-sm;
  color: var(--color-text-muted);
}
.blocked-alert {
  margin-top: $space-2;
  padding: $space-2 $space-3;
  background: rgba(var(--color-error-rgb, 220, 38, 38), 0.1);
  border: 1px solid var(--color-error);
  border-radius: $radius-md;
  font-size: $font-size-sm;
  color: var(--color-error);
}
</style>
