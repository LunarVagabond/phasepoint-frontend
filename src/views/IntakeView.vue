<template>
  <div class="intake">
    <header class="intake-header">
      <h1 class="intake-title">Bulk intake</h1>
      <p class="intake-desc">
        Set customer, then scan or enter serial (with manufacturer/model). Add items to the list and press Intake. You’ll be taken to the Assets page showing only this batch.
      </p>
    </header>

    <section class="intake-scan">
      <h2 class="section-title">Add to list</h2>
      <p class="scan-hint">Manufacturer, serial number, and customer are required. Customer stays selected for the next item.</p>
      <div class="scan-fields">
        <input
          v-model="newRow.manufacturer_model"
          placeholder="Manufacturer / model *"
          @keydown.enter.prevent="focusSerial"
        />
        <input
          ref="serialInputRef"
          v-model="newRow.serial_number"
          type="text"
          class="scan-input"
          placeholder="Serial number or scan *"
          @keydown.enter.prevent="addRow"
        />
        <select v-model="newRow.customer_id" class="customer-select" aria-label="Customer">
          <option value="">— Customer * —</option>
          <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <button
          type="button"
          class="btn-add-row"
          :disabled="!canAdd"
          @click="addRow"
        >
          Add
        </button>
      </div>
      <p v-if="addError" class="error-inline">{{ addError }}</p>
    </section>

    <section class="intake-list">
      <h2 class="section-title">Prepared list ({{ prepared.length }} items)</h2>
      <p v-if="!prepared.length" class="muted">No items yet. Enter manufacturer, serial, and customer above, then Add.</p>
      <table v-else class="prepared-table">
        <thead>
          <tr>
            <th>Manufacturer / model</th>
            <th>Serial number</th>
            <th>Customer</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in prepared" :key="index">
            <td>{{ row.manufacturer_model || '—' }}</td>
            <td>{{ row.serial_number || '—' }}</td>
            <td>{{ customerName(row.customer_id) }}</td>
            <td>
              <button type="button" class="btn-remove-row" aria-label="Remove" @click="removeRow(index)">×</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="intake-actions">
        <button
          type="button"
          class="btn-primary btn-intake"
          :disabled="prepared.length === 0 || submitting"
          @click="submitIntake"
        >
          {{ submitting ? 'Intaking…' : 'Intake' }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </section>

    <p class="back-link"><router-link to="/">Back to dashboard</router-link></p>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCustomers, bulkIntake } from '../api'
import type { BulkIntakeItem } from '../api'

const router = useRouter()
const customers = ref<Awaited<ReturnType<typeof getCustomers>>>([])
const serialInputRef = ref<HTMLInputElement | null>(null)
const newRow = reactive<BulkIntakeItem & { manufacturer_model: string; serial_number: string; customer_id: string | null }>({
  manufacturer_model: '',
  serial_number: '',
  customer_id: null,
})
const prepared = ref<BulkIntakeItem[]>([])
const submitting = ref(false)
const error = ref('')
const addError = ref('')

const canAdd = computed(() => {
  const m = newRow.manufacturer_model?.trim()
  const s = newRow.serial_number?.trim()
  const c = newRow.customer_id
  return !!(m && s && c)
})

onMounted(async () => {
  customers.value = await getCustomers()
})

function focusSerial() {
  serialInputRef.value?.focus()
}

function customerName(customerId: string | null | undefined) {
  if (!customerId) return '—'
  const c = customers.value.find((x) => x.id === customerId)
  return c ? c.name : '—'
}

function addRow() {
  if (!canAdd.value) {
    addError.value = 'Manufacturer, serial number, and customer are required.'
    return
  }
  addError.value = ''
  prepared.value.push({
    manufacturer_model: newRow.manufacturer_model.trim(),
    serial_number: newRow.serial_number.trim(),
    customer_id: newRow.customer_id!,
  })
  newRow.manufacturer_model = ''
  newRow.serial_number = ''
  newRow.customer_id = newRow.customer_id
  serialInputRef.value?.focus()
}

function removeRow(index: number) {
  prepared.value.splice(index, 1)
}

async function submitIntake() {
  if (prepared.value.length === 0) return
  error.value = ''
  submitting.value = true
  try {
    const result = await bulkIntake(prepared.value)
    await router.push({ path: '/assets', query: { intake_batch: result.batch_id } })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Intake failed.'
  } finally {
    submitting.value = false
  }
}
</script>

