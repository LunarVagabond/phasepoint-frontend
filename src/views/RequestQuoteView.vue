<template>
  <div class="request-quote portal-request-page">
    <header class="request-quote-header">
      <h1 class="request-quote-title">Create Disposal Request</h1>
      <p class="request-quote-desc">Submit a new request for intake, data wiping, and disposition processing.</p>
    </header>

    <form class="request-quote-form professional-form" @submit.prevent="onSubmit">
      <section class="form-section">
        <div class="section-title-row">
          <h2 class="section-title">Asset Inventory</h2>
          <div v-if="inventoryMode === 'detailed'" class="template-actions-inline">
            <input
              ref="csvFileInput"
              type="file"
              accept=".csv"
              class="csv-file-input"
              aria-label="Upload CSV file"
              @change="onCsvFileSelected"
            />
            <button type="button" class="btn-link btn-sm" @click="triggerCsvUpload">Upload CSV</button>
            <span class="template-actions-sep">·</span>
            <button type="button" class="btn-link btn-sm" :disabled="downloadingTemplate" @click="downloadTemplate">
              {{ downloadingTemplate ? 'Downloading…' : 'CSV template' }}
            </button>
            <span class="template-actions-sep">·</span>
            <button type="button" class="btn-link btn-sm" @click="showImportGuide = true">Import guide</button>
          </div>
        </div>
        <div class="inventory-tabs">
          <button type="button" class="inventory-tab" :class="{ active: inventoryMode === 'detailed' }" @click="inventoryMode = 'detailed'">
            Detailed list
          </button>
          <button type="button" class="inventory-tab" :class="{ active: inventoryMode === 'quantity' }" @click="inventoryMode = 'quantity'">
            Quantity only
          </button>
        </div>
        <p class="section-hint">
          <template v-if="inventoryMode === 'detailed'">Add items below or upload a CSV (export from Excel if needed).</template>
          <template v-else>Enter how many of each type you have. No serial numbers or models required.</template>
        </p>
        <p v-if="csvImportError" class="error-inline">{{ csvImportError }}</p>

        <template v-if="inventoryMode === 'detailed'">
        <div class="add-row-toolbar">
          <select v-model="newRow.asset_type" class="text-input type-select" aria-label="Type">
            <option value="">— Type * —</option>
            <option v-for="opt in INTAKE_REQUEST_ASSET_TYPES" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <input
            v-if="newRow.asset_type === 'OTHER'"
            v-model="newRow.type_other"
            type="text"
            class="text-input type-other-inline"
            placeholder="Describe other *"
            maxlength="255"
          />
          <input
            v-model="newRow.manufacturer_model"
            type="text"
            class="text-input"
            placeholder="Manufacturer / Model (optional)"
            maxlength="255"
          />
          <input
            v-model="newRow.serial_number"
            type="text"
            class="text-input"
            placeholder="Serial number (optional)"
            maxlength="255"
          />
          <button type="button" class="btn-add-row" :disabled="!canAddRow" @click="addRow">Add</button>
        </div>
        <p v-if="errors.items" class="error-inline">{{ errors.items }}</p>
        <div class="items-table-wrap">
          <table v-if="items.length > 0" class="items-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Manufacturer / Model</th>
                <th>Serial number</th>
                <th>Other description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in items" :key="idx">
                <td>
                  <select v-model="row.asset_type" class="table-input table-select" aria-label="Type" @change="row.asset_type !== 'OTHER' && (row.type_other = '')">
                    <option v-for="opt in INTAKE_REQUEST_ASSET_TYPES" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                </td>
                <td>
                  <input v-model="row.manufacturer_model" type="text" class="table-input" maxlength="255" />
                </td>
                <td>
                  <input v-model="row.serial_number" type="text" class="table-input" maxlength="255" />
                </td>
                <td>
                  <input
                    v-if="row.asset_type === 'OTHER'"
                    v-model="row.type_other"
                    type="text"
                    class="table-input"
                    placeholder="Required for Other"
                    maxlength="255"
                  />
                  <span v-else class="muted">—</span>
                </td>
                <td>
                  <button type="button" class="btn-remove-row" aria-label="Remove" @click="removeRow(idx)">×</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="muted">No items yet. Add items above.</p>
        </div>
        </template>

        <template v-else>
        <div class="quantity-fields">
          <div v-for="opt in INTAKE_REQUEST_ASSET_TYPES" :key="opt.value" class="quantity-row">
            <label class="quantity-label">{{ opt.label }}</label>
            <input
              v-model.number="quantityByType[opt.value]"
              type="number"
              min="0"
              step="1"
              class="quantity-input"
              :aria-label="`Quantity of ${opt.label}`"
            />
          </div>
          <div v-if="quantityByType.OTHER > 0" class="quantity-other-desc">
            <label class="field-label" for="quantity-type-other">Describe other (required)</label>
            <input
              id="quantity-type-other"
              v-model="quantityOtherDescription"
              type="text"
              class="text-input"
              placeholder="e.g. Monitors, Keyboards"
              maxlength="255"
            />
          </div>
        </div>
        </template>
      </section>

      <section class="form-section">
        <h2 class="section-title">Primary Contact</h2>
        <p class="section-hint">Optional updates for this specific request. We will default to your customer account information if you do not provide these options</p>
        <hr />
        <div class="contact-fields">
          <div class="field-group">
            <label class="field-label" for="contact-name">Contact name</label>
            <input
              id="contact-name"
              v-model="contactName"
              type="text"
              class="text-input"
              placeholder="Full name"
              maxlength="255"
            />
          </div>
          <div class="field-group">
            <label class="field-label" for="contact-email">Email</label>
            <input
              id="contact-email"
              v-model="contactEmail"
              type="email"
              class="text-input"
              placeholder="email@company.com"
              maxlength="254"
            />
            <p v-if="errors.contact_email" class="error-inline">{{ errors.contact_email }}</p>
          </div>
          <div class="field-group">
            <label class="field-label" for="contact-phone">Phone</label>
            <input
              id="contact-phone"
              v-model="contactPhone"
              type="tel"
              class="text-input"
              placeholder="Optional"
              maxlength="64"
            />
          </div>
        </div>
      </section>

      <section class="form-section">
        <h2 class="section-title">Logistics</h2>
        <p class="section-hint">Let us know if you prefer a pickup or will drop equipment off at our facility.</p>
        <div class="delivery-toggle">
          <label class="radio-label">
            <input v-model="deliveryType" type="radio" value="PICKUP" />
            Pickup
          </label>
          <label class="radio-label">
            <input v-model="deliveryType" type="radio" value="DROP_OFF" />
            Drop Off
          </label>
        </div>
        <div v-if="deliveryType === 'DROP_OFF'" class="dropoff-window">
          <p class="section-hint">Optionally provide your preferred date and estimated time for drop-off.</p>
          <div>
            <label class="field-label" for="dropoff-preferred">Preferred date & time</label>
            <input id="dropoff-preferred" v-model="dropOffPreferredAt" type="datetime-local" class="text-input" />
          </div>
        </div>
      </section>

      <section class="form-section">
        <h2 class="section-title">Operational Notes</h2>
        <p class="section-hint">Include scheduling preferences, compliance constraints, or packaging notes.</p>
        <label class="field-label" for="notes">Notes</label>
        <textarea
          id="notes"
          v-model="notes"
          class="textarea-input"
          placeholder="e.g. approximate quantity, preferred pickup window, compliance requirements…"
          rows="4"
          maxlength="2000"
        />
        <p class="char-hint">{{ notes.length }} / 2000</p>
      </section>

      <div class="form-actions">
        <button type="submit" class="btn-primary" :disabled="submitting">
          {{ submitting ? 'Submitting...' : isReadonlyPortal ? 'Read-only Preview' : 'Submit Request' }}
        </button>
        <p v-if="submitError" class="error">{{ submitError }}</p>
      </div>
    </form>

    <p class="back-link">
      <router-link to="/customer-portal">Back to customer portal</router-link>
    </p>

    <div v-if="showImportGuide" class="modal-backdrop" @click.self="showImportGuide = false">
      <div class="modal import-guide-modal" @click.stop>
        <h3>CSV import guide</h3>
        <p>Use our CSV template to list many items at once. Columns:</p>
        <ul>
          <li><strong>type</strong> — One of: PHONE, LAPTOP, TABLET, SERVER, OTHER (required)</li>
          <li><strong>manufacturer_model</strong> — Optional (e.g. Dell Latitude 5520)</li>
          <li><strong>serial_number</strong> — Optional; your tracking ID for the item</li>
          <li><strong>type_other</strong> — Required when type is OTHER; describe what “other” means</li>
        </ul>
        <p>Export your spreadsheet to CSV (we do not accept Excel files). After uploading, review the parsed rows in the table and edit if needed before submitting.</p>
        <button type="button" class="btn-primary" @click="showImportGuide = false">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Papa from 'papaparse'
import { computed, ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createIntakeRequest, downloadIntakeRequestTemplateCSV, INTAKE_REQUEST_ASSET_TYPES } from '../api'
import type { IntakeRequestItem } from '../api'

type ItemRow = { asset_type: string; serial_number: string; manufacturer_model: string; type_other: string }

const inventoryMode = ref<'detailed' | 'quantity'>('detailed')
const items = ref<ItemRow[]>([])
const quantityByType = reactive<Record<string, number>>(
  Object.fromEntries(INTAKE_REQUEST_ASSET_TYPES.map((o) => [o.value, 0]))
)
const quantityOtherDescription = ref('')
const newRow = reactive<ItemRow>({
  asset_type: '',
  serial_number: '',
  manufacturer_model: '',
  type_other: '',
})
const contactName = ref('')
const contactEmail = ref('')
const contactPhone = ref('')
const notes = ref('')
const deliveryType = ref<'PICKUP' | 'DROP_OFF'>('PICKUP')
const dropOffPreferredAt = ref('')
const submitting = ref(false)
const submitError = ref('')
const showImportGuide = ref(false)
const downloadingTemplate = ref(false)
const csvFileInput = ref<HTMLInputElement | null>(null)
const csvImportError = ref('')
const router = useRouter()
const route = useRoute()
const isReadonlyPortal = computed(() => route.path.includes('/employee-portal/customers/') || Boolean(route.meta.customerPortalReadonly))
const errors = ref<{
  items?: string
  contact_email?: string
}>({})

const validTypes = new Set<string>(INTAKE_REQUEST_ASSET_TYPES.map((o) => o.value))

const canAddRow = computed(() => {
  const t = newRow.asset_type?.trim()
  if (!t || !validTypes.has(t)) return false
  if (t === 'OTHER') return !!newRow.type_other?.trim()
  return true
})

function addRow() {
  const t = newRow.asset_type?.trim().toUpperCase()
  if (!t || !validTypes.has(t)) return
  if (t === 'OTHER' && !newRow.type_other?.trim()) return
  items.value.push({
    asset_type: t,
    serial_number: (newRow.serial_number || '').trim().slice(0, 255),
    manufacturer_model: (newRow.manufacturer_model || '').trim().slice(0, 255),
    type_other: t === 'OTHER' ? (newRow.type_other || '').trim().slice(0, 255) : '',
  })
  newRow.asset_type = ''
  newRow.serial_number = ''
  newRow.manufacturer_model = ''
  newRow.type_other = ''
}

function removeRow(idx: number) {
  items.value.splice(idx, 1)
}

async function downloadTemplate() {
  downloadingTemplate.value = true
  try {
    await downloadIntakeRequestTemplateCSV()
  } catch {
    // Optional: show a toast or inline error
  } finally {
    downloadingTemplate.value = false
  }
}

function triggerCsvUpload() {
  csvImportError.value = ''
  csvFileInput.value?.click()
}

function onCsvFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  csvImportError.value = ''
  const reader = new FileReader()
  reader.onload = () => {
    const text = (reader.result as string) ?? ''
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    })
    if (parsed.errors.length > 0) {
      csvImportError.value = 'CSV parse error. Check the file format (use our template or export to CSV from Excel).'
      input.value = ''
      return
    }
    const rows = parsed.data
    if (rows.length === 0) {
      csvImportError.value = 'CSV has no data rows.'
      input.value = ''
      return
    }
    const first = rows[0]
    const keys = Object.keys(first).map((k) => k.trim().toLowerCase())
    const hasType = keys.some((k) => k === 'type')
    if (!hasType) {
      csvImportError.value = 'CSV must have a "type" column. Use our template or the Import guide.'
      input.value = ''
      return
    }
    const normalized: ItemRow[] = []
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const typeVal = (row['type'] ?? row['Type'] ?? '').trim().toUpperCase()
      if (!typeVal || !validTypes.has(typeVal)) {
        csvImportError.value = `Row ${i + 2}: invalid type "${(row['type'] ?? row['Type'] ?? '').trim()}". Use: ${[...validTypes].join(', ')}.`
        input.value = ''
        return
      }
      if (typeVal === 'OTHER') {
        const otherVal = (row['type_other'] ?? row['Type_other'] ?? '').trim()
        if (!otherVal) {
          csvImportError.value = `Row ${i + 2}: type is OTHER but "type_other" is empty. Describe the item.`
          input.value = ''
          return
        }
      }
      normalized.push({
        asset_type: typeVal,
        manufacturer_model: (row['manufacturer_model'] ?? row['Manufacturer_model'] ?? '').trim().slice(0, 255),
        serial_number: (row['serial_number'] ?? row['Serial_number'] ?? '').trim().slice(0, 255),
        type_other: typeVal === 'OTHER' ? (row['type_other'] ?? row['Type_other'] ?? '').trim().slice(0, 255) : '',
      })
    }
    csvImportError.value = ''
    items.value.push(...normalized)
    input.value = ''
  }
  reader.readAsText(file, 'UTF-8')
}

function validate(): boolean {
  errors.value = {}
  if (inventoryMode.value === 'quantity') {
    const total = INTAKE_REQUEST_ASSET_TYPES.reduce((sum, opt) => sum + (quantityByType[opt.value] || 0), 0)
    if (total === 0) {
      errors.value.items = 'Enter at least one quantity.'
      return false
    }
    if ((quantityByType.OTHER || 0) > 0 && !quantityOtherDescription.value?.trim()) {
      errors.value.items = 'Describe what "Other" refers to when you have a quantity of Other.'
      return false
    }
  } else {
    if (items.value.length === 0) {
      errors.value.items = 'Add at least one item.'
      return false
    }
    const otherMissing = items.value.some((r) => r.asset_type === 'OTHER' && !r.type_other?.trim())
    if (otherMissing) {
      errors.value.items = 'For items with type "Other", enter a description in the Other description column.'
      return false
    }
  }
  const email = contactEmail.value.trim()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.value.contact_email = 'Enter a valid email address.'
  }
  return Object.keys(errors.value).length === 0
}

function buildPayloadItems(): IntakeRequestItem[] {
  if (inventoryMode.value === 'quantity') {
    const list: IntakeRequestItem[] = []
    for (const opt of INTAKE_REQUEST_ASSET_TYPES) {
      const qty = Math.max(0, Math.floor(quantityByType[opt.value] || 0))
      const typeOther = opt.value === 'OTHER' ? quantityOtherDescription.value?.trim().slice(0, 255) : undefined
      for (let i = 0; i < qty; i++) {
        list.push({
          asset_type: opt.value,
          serial_number: undefined,
          manufacturer_model: undefined,
          type_other: typeOther || undefined,
        })
      }
    }
    return list
  }
  return items.value.map((r) => ({
    asset_type: r.asset_type,
    serial_number: r.serial_number || undefined,
    manufacturer_model: r.manufacturer_model || undefined,
    type_other: r.asset_type === 'OTHER' ? r.type_other || undefined : undefined,
  }))
}

async function onSubmit() {
  if (isReadonlyPortal.value) return
  submitError.value = ''
  if (!validate()) return
  submitting.value = true
  try {
    const payload: Parameters<typeof createIntakeRequest>[0] = {
      items: buildPayloadItems(),
      notes: notes.value.trim().slice(0, 2000),
      contact_name: contactName.value.trim(),
      contact_email: contactEmail.value.trim(),
      contact_phone: contactPhone.value.trim().slice(0, 64),
      delivery_type: deliveryType.value,
    }
    if (deliveryType.value === 'DROP_OFF' && dropOffPreferredAt.value) {
      payload.drop_off_preferred_start = new Date(dropOffPreferredAt.value).toISOString()
    }
    await createIntakeRequest(payload)
    await router.push('/customer-portal')
  } catch (e) {
    submitError.value = e instanceof Error ? e.message : 'Submission failed.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
@use '../styles/views/request-quote';
@use '../styles/variables' as *;

.request-quote {
  max-width: 900px;
  margin: 0 auto;
  padding: $space-2 0;
}

.request-quote-header {
  margin-bottom: $space-8;
}

.request-quote-title {
  font-size: $font-size-2xl;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 $space-2;
}

.request-quote-desc {
  font-size: $font-size-base;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.5;
}

.professional-form { display: grid; gap: $space-5; }
.form-section { margin-bottom: 0; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: $radius-lg; padding: $space-5; box-shadow: var(--shadow-sm); }

.section-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $space-2 $space-4;
  margin-bottom: $space-2;
}
.section-title {
  font-size: $font-size-lg;
  font-weight: 600;
  margin: 0;
  color: var(--color-text);
}
.template-actions-inline {
  display: flex;
  align-items: center;
  gap: $space-1;
  font-size: $font-size-xs;
}
.template-actions-inline .btn-link.btn-sm {
  font-size: $font-size-xs;
}
.template-actions-sep {
  color: var(--color-text-muted);
  font-size: $font-size-xs;
  user-select: none;
}
.section-hint {
  font-size: $font-size-sm;
  color: var(--color-text-muted);
  margin: 0 0 $space-3;
}

.inventory-tabs {
  display: flex;
  gap: 0;
  margin-bottom: $space-3;
  border-bottom: 1px solid var(--color-border);
}
.inventory-tab {
  padding: $space-2 $space-4;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  font-size: $font-size-sm;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
}
.inventory-tab:hover {
  color: var(--color-text);
}
.inventory-tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.quantity-fields {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  max-width: 20rem;
}
.quantity-row {
  display: flex;
  align-items: center;
  gap: $space-3;
}
.quantity-label {
  min-width: 6rem;
  font-size: $font-size-sm;
  font-weight: 500;
  color: var(--color-text);
}
.quantity-input {
  width: 5rem;
  padding: $space-1 $space-2;
  border: 1px solid var(--color-border);
  border-radius: $radius-sm;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: inherit;
}
.quantity-other-desc {
  margin-top: $space-2;
  padding-top: $space-3;
  border-top: 1px solid var(--color-border);
}
.quantity-other-desc .field-label {
  margin-bottom: $space-1;
}

.field-label {
  display: block;
  font-size: $font-size-sm;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: $space-1;
}
.required {
  color: var(--color-error);
}

.add-row-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;
  margin-bottom: $space-3;
}
.add-row-toolbar .text-input {
  min-width: 10rem;
}
.type-select {
  min-width: 8rem;
}
.btn-add-row {
  padding: $space-2 $space-4;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: $radius-md;
  font-weight: 500;
  cursor: pointer;
}
.btn-add-row:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.items-table-wrap {
  overflow-x: auto;
}
.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: $font-size-sm;
}
.items-table th,
.items-table td {
  padding: $space-2 $space-3;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}
.items-table th {
  font-weight: 600;
  color: var(--color-text-muted);
  background: var(--color-background);
}
.table-input {
  width: 100%;
  min-width: 8rem;
  padding: $space-1 $space-2;
  border: 1px solid var(--color-border);
  border-radius: $radius-sm;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: inherit;
}
.table-select {
  cursor: pointer;
}
.btn-remove-row {
  padding: 0.2rem 0.5rem;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: $radius-sm;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
}
.btn-remove-row:hover {
  background: var(--color-background);
}
.muted {
  color: var(--color-text-muted);
  font-size: $font-size-sm;
}

.type-other-inline {
  min-width: 12rem;
}
.csv-file-input {
  position: absolute;
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  overflow: hidden;
  z-index: -1;
}
.btn-link {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: $font-size-sm;
  text-decoration: underline;
  padding: 0;
}
.btn-link:hover {
  text-decoration: none;
}
.btn-link:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-link.btn-sm {
  font-size: $font-size-xs;
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.import-guide-modal {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: $radius-lg;
  padding: $space-5;
  max-width: 28rem;
  max-height: 90vh;
  overflow-y: auto;
}
.import-guide-modal h3 {
  margin: 0 0 $space-3;
  font-size: $font-size-lg;
}
.import-guide-modal p {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  color: var(--color-text);
}
.import-guide-modal ul {
  margin: 0 0 $space-3;
  padding-left: 1.25rem;
}
.import-guide-modal li {
  margin-bottom: $space-1;
  font-size: $font-size-sm;
}
.import-guide-modal .btn-primary {
  margin-top: $space-2;
}

.text-input {
  width: 100%;
  padding: $space-3 $space-4;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: $font-size-base;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.text-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 37, 99, 235), 0.1);
}

.contact-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $space-4;
}
@media (max-width: 900px) {
  .asset-types-grid { grid-template-columns: 1fr; }
  .contact-fields {
    grid-template-columns: 1fr;
  }
}

.field-group {
  min-width: 0;
}

.textarea-input {
  width: 100%;
  padding: $space-3 $space-4;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: $font-size-base;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.textarea-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 37, 99, 235), 0.1);
}

.char-hint {
  font-size: $font-size-sm;
  color: var(--color-text-muted);
  margin: $space-1 0 0;
}

.error-inline,
.error {
  color: var(--color-error);
  font-size: $font-size-sm;
  margin: $space-2 0 0;
}

.form-actions {
  margin-top: $space-2;
  display: flex;
  align-items: center;
  gap: $space-3;
}

.btn-primary {
  padding: $space-3 $space-8;
  font-size: $font-size-base;
  font-weight: 600;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}
.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.back-link {
  margin-top: $space-8;
}
</style>
