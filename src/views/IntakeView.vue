<template>
  <div class="intake">
    <header class="intake-header">
      <h1 class="intake-title">Intake</h1>
      <p class="intake-desc">
        Select customer and optionally an intake request, then scan or enter assets. Add items to the list and press Intake.
      </p>
    </header>

    <!-- Section 1: Customer, then Intake request (static once set) -->
    <section class="intake-section intake-section-top">
      <h2 class="section-title">Customer | Intake request</h2>
      <div class="section-stack">
        <div class="section-block">
          <label class="block-label">Customer</label>
          <select
            v-model="customerChoice"
            class="customer-select"
            aria-label="Customer"
            @change="onCustomerChange"
          >
            <option value="">— Customer —</option>
            <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
            <option value="new_customer">New customer (walk-in)</option>
          </select>

          <template v-if="customerChoice === 'new_customer'">
            <div class="new-customer-form">
              <label>Company / name *</label>
              <input v-model="newCustomerForm.name" type="text" placeholder="Required" />
              <label>Email (optional)</label>
              <input v-model="newCustomerForm.email" type="email" placeholder="email@example.com" />
              <label>Phone (optional)</label>
              <input v-model="newCustomerForm.phone" type="tel" placeholder="Phone" />
            </div>
          </template>
        </div>

        <div v-if="customerChoice && customerChoice !== 'new_customer'" class="section-block intake-request-row">
          <label class="block-label">Intake request</label>
          <select
            v-model="intakeRequestChoice"
            class="customer-select intake-request-select"
            aria-label="Intake request"
            :disabled="loadingOpenRequests || (openRequestsLoaded && openRequests.length === 0)"
            @change="onIntakeRequestChoiceChange"
          >
            <option v-if="loadingOpenRequests" value="" disabled>Loading…</option>
            <template v-else-if="openRequestsLoaded">
              <option v-if="openRequests.length === 0" value="" disabled>No open requests</option>
              <template v-else>
                <option v-for="r in openRequests" :key="r.id" :value="r.id">
                  {{ requestSummaryText(r) }} ({{ shortId(r.id) }})
                </option>
                <option :value="SKIP_VALUE">Skip (walk-in / one-off)</option>
              </template>
            </template>
            <option v-else value="">— Select —</option>
          </select>
          <p v-if="noOpenRequestsNotification" class="notification-inline">No open requests</p>
          <p v-if="requestLoadError" class="error-inline">{{ requestLoadError }}</p>
        </div>
      </div>
    </section>

    <!-- Section 2: Add Asset list -->
    <section class="intake-section">
      <h2 class="section-title">Add asset</h2>
      <p class="scan-hint">
        <template v-if="selectedRequest">
          Choose type, then serial and/or manufacturer. Customer and request stay fixed.
        </template>
        <template v-else>
          Enter manufacturer and serial. Customer is fixed.
        </template>
      </p>
      <div class="scan-fields">
        <template v-if="selectedRequest">
          <select v-model="newRow.asset_type" class="customer-select" aria-label="Asset type">
            <option value="">— Type * —</option>
            <option v-for="code in (selectedRequest.asset_types || [])" :key="code" :value="code">{{ assetTypeLabel(code) }}</option>
          </select>
        </template>
        <input
          v-model="newRow.manufacturer_model"
          type="text"
          placeholder="Manufacturer / model"
          @keydown.enter.prevent="focusSerial"
        />
        <input
          ref="serialInputRef"
          v-model="newRow.serial_number"
          type="text"
          class="scan-input"
          placeholder="Serial number or scan"
          @keydown.enter.prevent="addRow"
        />
        <button
          type="button"
          class="btn-add-row"
          :disabled="!canAddRow"
          @click="addRow"
        >
          Add
        </button>
      </div>
      <p v-if="addError" class="error-inline">{{ addError }}</p>

      <div class="prepared-header">
        <h3 class="section-subtitle">List ({{ prepared.length }} items)</h3>
      </div>
      <p v-if="prepared.length === 0" class="muted">No items yet. Add assets above.</p>
      <table v-else class="prepared-table">
        <thead>
          <tr>
            <th v-if="selectedRequest">Type</th>
            <th>Manufacturer / model</th>
            <th>Serial number</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in prepared" :key="index">
            <td v-if="selectedRequest">{{ row.asset_type ? assetTypeLabel(row.asset_type) : '—' }}</td>
            <td>{{ row.manufacturer_model || '—' }}</td>
            <td>{{ row.serial_number || '—' }}</td>
            <td>
              <button type="button" class="btn-remove-row" aria-label="Remove" @click="removeRow(index)">×</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Section 3: Intake button -->
    <section class="intake-section intake-actions-section">
      <button
        type="button"
        class="btn-primary btn-intake"
        :disabled="!canSubmitIntake || submitting"
        @click="submitIntake"
      >
        {{ submitting ? 'Intaking…' : 'Intake' }}
      </button>
      <p v-if="submitError" class="error">{{ submitError }}</p>
    </section>

    <p class="back-link"><router-link to="/employee-portal">Back to dashboard</router-link></p>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getCustomers,
  createCustomer,
  bulkIntake,
  getIntakeRequest,
  getIntakeRequests,
  startIntakeForRequest,
  receiveAssetForRequest,
  INTAKE_REQUEST_ASSET_TYPES,
} from '../api'
import type { BulkIntakeItem, IntakeRequestSummary } from '../api'

const NEW_CUSTOMER_VALUE = 'new_customer'
const SKIP_VALUE = '__skip__'

const router = useRouter()
const customers = ref<Awaited<ReturnType<typeof getCustomers>>>([])
const customerChoice = ref<string>('')
const newCustomerForm = reactive({ name: '', email: '', phone: '' })
const selectedRequest = ref<(IntakeRequestSummary & { received_quantities?: Record<string, number> }) | null>(null)
const openRequests = ref<IntakeRequestSummary[]>([])
const openRequestsLoaded = ref(false)
const loadingOpenRequests = ref(false)
const requestLoadError = ref('')
const skipPathChosen = ref(false)
const intakeRequestChoice = ref<string>('')
const noOpenRequestsNotification = computed(
  () => openRequestsLoaded.value && openRequests.value.length === 0
)

type PreparedRowRequest = { asset_type: string; serial_number: string; manufacturer_model: string }
type PreparedRowOneOff = { manufacturer_model: string; serial_number: string; customer_id: string }
const prepared = ref<Array<PreparedRowRequest | PreparedRowOneOff>>([])
const newRow = reactive({
  asset_type: '',
  manufacturer_model: '',
  serial_number: '',
})
const serialInputRef = ref<HTMLInputElement | null>(null)
const addError = ref('')
const submitting = ref(false)
const submitError = ref('')

const isNewCustomer = computed(() => customerChoice.value === NEW_CUSTOMER_VALUE)
const isRequestMode = computed(() => !!selectedRequest.value)
const effectiveCustomerId = computed(() => {
  if (!customerChoice.value || customerChoice.value === NEW_CUSTOMER_VALUE) return null
  return customerChoice.value
})

const canAddRow = computed(() => {
  if (selectedRequest.value) {
    return !!newRow.asset_type?.trim()
  }
  const hasCustomer = !!effectiveCustomerId.value || isNewCustomer.value
  return !!(newRow.manufacturer_model?.trim() || newRow.serial_number?.trim()) && hasCustomer
})

const newCustomerValid = computed(() => !!newCustomerForm.name?.trim())

const canSubmitIntake = computed(() => {
  if (prepared.value.length === 0) return false
  if (isNewCustomer.value) return newCustomerValid.value
  if (isRequestMode.value) return true
  return !!effectiveCustomerId.value
})

function assetTypeLabel(code: string): string {
  return INTAKE_REQUEST_ASSET_TYPES.find((o) => o.value === code)?.label ?? code
}

function requestSummaryText(r: IntakeRequestSummary): string {
  const types = r.asset_quantities_display || r.asset_types_display?.join(', ') || '—'
  return `${types} · ${r.status || '—'}`
}

function shortId(id: string): string {
  if (!id || id.length < 9) return id
  return id.slice(0, 8)
}

function onCustomerChange() {
  selectedRequest.value = null
  openRequests.value = []
  openRequestsLoaded.value = false
  requestLoadError.value = ''
  skipPathChosen.value = false
  intakeRequestChoice.value = ''
  if (effectiveCustomerId.value) loadOpenRequests()
}

async function onIntakeRequestChoiceChange() {
  const val = intakeRequestChoice.value
  if (val === SKIP_VALUE || !val) {
    skipPathChosen.value = true
    selectedRequest.value = null
    return
  }
  skipPathChosen.value = false
  const r = openRequests.value.find((x) => x.id === val)
  if (r) await selectRequest(r)
}

async function loadOpenRequests() {
  if (!effectiveCustomerId.value) return
  requestLoadError.value = ''
  openRequestsLoaded.value = false
  loadingOpenRequests.value = true
  try {
    const list = await getIntakeRequests({
      customer_id: effectiveCustomerId.value,
      status: 'ACCEPTED,PICKING_UP',
      ordering: '-created_at',
      available_for_receive: true,
    })
    openRequests.value = list
    openRequestsLoaded.value = true
    if (list.length === 0) {
      intakeRequestChoice.value = ''
      skipPathChosen.value = true
      selectedRequest.value = null
    } else {
      intakeRequestChoice.value = list[0].id
      skipPathChosen.value = false
      await selectRequest(list[0])
    }
  } catch (e) {
    requestLoadError.value = e instanceof Error ? e.message : 'Failed to load requests.'
    openRequestsLoaded.value = true
  } finally {
    loadingOpenRequests.value = false
  }
}

async function selectRequest(r: IntakeRequestSummary) {
  requestLoadError.value = ''
  if (r.status === 'ACCEPTED') {
    try {
      const updated = await startIntakeForRequest(r.id)
      selectedRequest.value = updated as IntakeRequestSummary & { received_quantities?: Record<string, number> }
    } catch (e) {
      requestLoadError.value = e instanceof Error ? e.message : 'Failed to start intake.'
      return
    }
  } else {
    try {
      const detail = await getIntakeRequest(r.id)
      selectedRequest.value = detail as IntakeRequestSummary & { received_quantities?: Record<string, number> }
    } catch (e) {
      requestLoadError.value = e instanceof Error ? e.message : 'Failed to load request.'
    }
  }
}

function focusSerial() {
  serialInputRef.value?.focus()
}

function addRow() {
  addError.value = ''
  if (selectedRequest.value) {
    if (!newRow.asset_type?.trim()) {
      addError.value = 'Asset type is required.'
      return
    }
    prepared.value.push({
      asset_type: newRow.asset_type.trim(),
      serial_number: (newRow.serial_number || '').trim(),
      manufacturer_model: (newRow.manufacturer_model || '').trim(),
    })
  } else {
    const cid = effectiveCustomerId.value
    if (!cid && !isNewCustomer.value) {
      addError.value = 'Select a customer first.'
      return
    }
    if (!newRow.manufacturer_model?.trim() && !newRow.serial_number?.trim()) {
      addError.value = 'Enter manufacturer/model or serial number.'
      return
    }
    prepared.value.push({
      manufacturer_model: (newRow.manufacturer_model || '').trim(),
      serial_number: (newRow.serial_number || '').trim(),
      customer_id: cid || '', // will be set on submit when new customer
    })
  }
  newRow.asset_type = ''
  newRow.manufacturer_model = ''
  newRow.serial_number = ''
  serialInputRef.value?.focus()
}

function removeRow(index: number) {
  prepared.value.splice(index, 1)
}

async function submitIntake() {
  if (!canSubmitIntake.value) return
  submitError.value = ''
  submitting.value = true
  try {
    let customerId = effectiveCustomerId.value
    if (isNewCustomer.value) {
      const created = await createCustomer({
        name: newCustomerForm.name.trim(),
        email: newCustomerForm.email.trim() || undefined,
        phone: newCustomerForm.phone.trim() || undefined,
      })
      customerId = created.id
      customers.value = await getCustomers()
      customerChoice.value = created.id
    }

    if (isRequestMode.value && selectedRequest.value) {
      let batchId: string | null = null
      for (let i = 0; i < prepared.value.length; i++) {
        const row = prepared.value[i] as PreparedRowRequest
        const res = await receiveAssetForRequest(selectedRequest.value.id, {
          asset_type: row.asset_type,
          serial_number: row.serial_number || undefined,
          manufacturer_model: row.manufacturer_model || undefined,
        })
        const asset = res.asset as { intake_batch_id?: string }
        if (asset?.intake_batch_id) batchId = asset.intake_batch_id
      }
      await router.push({
        path: '/employee-portal/assets',
        query: batchId ? { intake_batch: batchId } : {},
      })
    } else {
      const items: BulkIntakeItem[] = (prepared.value as PreparedRowOneOff[]).map((row) => ({
        manufacturer_model: row.manufacturer_model || '',
        serial_number: row.serial_number || '',
        customer_id: customerId!, // resolved above (created for new customer or existing selection)
      }))
      const result = await bulkIntake(items)
      await router.push({ path: '/employee-portal/assets', query: { intake_batch: result.batch_id } })
    }
  } catch (e) {
    submitError.value = e instanceof Error ? e.message : 'Intake failed.'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  customers.value = await getCustomers()
})
</script>

<style scoped lang="scss">
.intake-header {
  margin-bottom: 1.5rem;
}
.intake-desc {
  color: var(--color-text-muted);
  margin: 0.5rem 0 0;
  font-size: 0.9375rem;
}

.intake-section {
  margin-bottom: 1.75rem;
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
}
.intake-section-top {
  padding: 1.25rem;
}
.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
}
.section-subtitle {
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 1rem 0 0.5rem;
}
.section-stack {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.section-block {
  .block-label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.35rem;
  }
  .block-hint {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    margin: 0.25rem 0 0.5rem;
  }
}
.customer-select {
  min-width: 100%;
  max-width: 20rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: inherit;
}
.intake-request-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1rem;
}
.intake-request-row .block-label {
  margin-bottom: 0;
  flex-shrink: 0;
}
.intake-request-row .intake-request-select {
  min-width: 16rem;
  max-width: 24rem;
}
.intake-request-row .error-inline,
.intake-request-row .notification-inline {
  width: 100%;
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
}
.intake-request-row .notification-inline {
  color: var(--color-text-muted);
}
.new-customer-form {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 20rem;
}
.new-customer-form label {
  font-size: 0.875rem;
  font-weight: 500;
}
.new-customer-form input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  font-size: inherit;
}
.open-requests-list {
  list-style: none;
  padding: 0;
  margin: 0.75rem 0 0;
  max-height: 10rem;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
}
.open-request-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.875rem;
}
.open-request-item:last-child {
  border-bottom: none;
}
.open-request-item:hover,
.open-request-item.selected {
  background: var(--color-background);
}
.request-summary-text {
  font-weight: 500;
  color: var(--color-text);
}
.request-id-short {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
.selected-request-badge {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-background);
  border-radius: 0.375rem;
  border: 1px solid var(--color-border);
  font-size: 0.875rem;
}
.selected-request-label {
  font-weight: 600;
  margin-right: 0.5rem;
  color: var(--color-text-muted);
}
.selected-request-text {
  color: var(--color-text);
}
.scan-hint {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin: 0 0 0.5rem;
}
.scan-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
.scan-fields input,
.scan-fields .customer-select {
  min-width: 10rem;
}
.scan-input {
  flex: 1;
  min-width: 12rem;
}
.btn-add-row {
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
}
.btn-add-row:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.prepared-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.prepared-table th,
.prepared-table td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}
.prepared-table th {
  font-weight: 600;
  color: var(--color-text-muted);
}
.btn-remove-row {
  padding: 0.2rem 0.5rem;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
}
.btn-remove-row:hover {
  background: var(--color-background);
}
.intake-actions-section {
  padding-top: 1rem;
}
.btn-intake {
  padding: 0.625rem 1.5rem;
  font-size: 1rem;
}
.error-inline,
.error {
  color: var(--color-error);
  margin-top: 0.5rem;
  font-size: 0.875rem;
}
.muted {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  margin: 0.5rem 0;
}
.back-link {
  margin-top: 1.5rem;
  font-size: 0.875rem;
}
.back-link a {
  color: var(--color-primary);
  text-decoration: none;
}
.back-link a:hover {
  text-decoration: underline;
}
</style>
