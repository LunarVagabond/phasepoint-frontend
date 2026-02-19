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
      <h2 class="section-title">Customer | Intake Request</h2>
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
      <h2 class="section-title">Add Asset</h2>
      <p class="scan-hint">
        <template v-if="selectedRequest">
          Choose type, then Serial Number and/or Manufacturer / Model. Customer and request stay fixed.
        </template>
        <template v-else>
          Enter Manufacturer / Model and Serial Number. Customer is fixed.
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
          placeholder="Manufacturer / Model"
          @keydown.enter.prevent="focusSerial"
        />
        <input
          ref="serialInputRef"
          v-model="newRow.serial_number"
          type="text"
          class="scan-input"
          placeholder="Serial Number or scan"
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
        <h3 class="section-subtitle">List ({{ prepared.length }} Items)</h3>
      </div>
      <p v-if="prepared.length === 0" class="muted">No items yet. Add assets above.</p>
      <table v-else class="prepared-table">
        <thead>
          <tr>
            <th v-if="selectedRequest">Type</th>
            <th>Manufacturer / Model</th>
            <th>Serial Number</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in prepared" :key="index">
            <td v-if="selectedRequest">{{ 'asset_type' in row && row.asset_type ? assetTypeLabel(row.asset_type) : '—' }}</td>
            <td>
              <input
                v-model="row.manufacturer_model"
                type="text"
                class="table-cell-input"
                placeholder="Manufacturer / Model"
              />
            </td>
            <td>
              <input
                v-model="row.serial_number"
                type="text"
                class="table-cell-input"
                placeholder="Serial Number"
              />
            </td>
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

type PreparedRowRequest = { asset_type: string; serial_number: string; manufacturer_model: string; type_other?: string }
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
  prepared.value = [] // Clear prepared assets when customer changes
  if (effectiveCustomerId.value) loadOpenRequests()
}

async function onIntakeRequestChoiceChange() {
  const val = intakeRequestChoice.value
  if (val === SKIP_VALUE || !val) {
    skipPathChosen.value = true
    selectedRequest.value = null
    prepared.value = [] // Clear prepared assets when skipping request
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
  let requestDetail: IntakeRequestSummary & { received_quantities?: Record<string, number> }
  
  if (r.status === 'ACCEPTED') {
    try {
      const updated = await startIntakeForRequest(r.id)
      requestDetail = updated as IntakeRequestSummary & { received_quantities?: Record<string, number> }
    } catch (e) {
      requestLoadError.value = e instanceof Error ? e.message : 'Failed to start intake.'
      return
    }
  } else {
    try {
      const detail = await getIntakeRequest(r.id)
      requestDetail = detail as IntakeRequestSummary & { received_quantities?: Record<string, number> }
    } catch (e) {
      requestLoadError.value = e instanceof Error ? e.message : 'Failed to load request.'
      return
    }
  }
  
  selectedRequest.value = requestDetail

  // Pre-fill Add Asset table: prefer request.items (one row per item), else asset_quantities
  prepared.value = []
  if (requestDetail.items && requestDetail.items.length > 0) {
    prepared.value = requestDetail.items.map((it) => ({
      asset_type: it.asset_type,
      manufacturer_model: it.manufacturer_model ?? '',
      serial_number: it.serial_number ?? '',
      type_other: it.asset_type === 'OTHER' ? (it.type_other ?? '') : undefined,
    }))
  } else if (requestDetail.asset_quantities) {
    const received = requestDetail.received_quantities || {}
    for (const [assetType, expectedQty] of Object.entries(requestDetail.asset_quantities)) {
      const receivedQty = received[assetType] || 0
      const remainingQty = expectedQty - receivedQty
      for (let i = 0; i < remainingQty; i++) {
        prepared.value.push({
          asset_type: assetType,
          serial_number: '',
          manufacturer_model: '',
        })
      }
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
      addError.value = 'Enter Manufacturer / Model or Serial Number.'
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
          type_other: row.asset_type === 'OTHER' ? (row.type_other || undefined) : undefined,
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
@use '../styles/views/intake';
</style>
