<template>
  <div class="shipments-list">
    <div class="page-header">
      <h1>Shipments</h1>
      <p class="page-description">Create a shipment, then add assets on the shipment detail page (import from a work order or add individually).</p>
      <button type="button" class="btn-primary" :disabled="createLoading" @click="createAndGo">
        {{ createLoading ? 'Creating…' : 'Create shipment' }}
      </button>
    </div>

    <div class="filters-section">
      <div class="filter-group">
        <label>Customer</label>
        <select v-model="customerFilter" class="filter-select" @change="loadShipments">
          <option value="">All</option>
          <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
    </div>

    <DataTable
      :columns="columns"
      :data="shipments"
      :loading="loading"
      row-key="id"
      :row-click="openShipment"
    />
    <p v-if="!loading && shipments.length === 0" class="empty-message">No shipments yet. Create one to get started.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '../components/DataTable.vue'
import { getShipments, createShipmentStandalone, getCustomers, type ShipmentListSummary, type CustomerSummary } from '../api'

const router = useRouter()
const loading = ref(false)
const createLoading = ref(false)
const shipments = ref<ShipmentListSummary[]>([])
const customers = ref<CustomerSummary[]>([])
const customerFilter = ref('')

const columns = [
  { key: 'carrier', label: 'Carrier', sortable: true },
  { key: 'tracking_number', label: 'Tracking', sortable: true },
  { key: 'shipped_at', label: 'Shipped', sortable: true },
  { key: 'destination_type', label: 'Destination Type', sortable: true },
  { key: 'destination_address', label: 'Destination', sortable: true },
  { key: 'asset_count', label: 'Assets', sortable: true },
]

function openShipment(row: Record<string, unknown>) {
  const id = row.id as string
  if (id) router.push(`/employee-portal/shipments/${id}`)
}

async function loadShipments() {
  loading.value = true
  try {
    shipments.value = await getShipments(
      customerFilter.value ? { customer_id: customerFilter.value } : undefined
    )
  } catch (e) {
    console.error(e)
    shipments.value = []
  } finally {
    loading.value = false
  }
}

async function createAndGo() {
  createLoading.value = true
  try {
    const created = await createShipmentStandalone()
    await loadShipments()
    router.push(`/employee-portal/shipments/${created.id}`)
  } catch (e) {
    console.error(e)
  } finally {
    createLoading.value = false
  }
}

onMounted(async () => {
  try {
    customers.value = await getCustomers()
  } catch {
    customers.value = []
  }
  await loadShipments()
})
</script>

<style scoped lang="scss">
@use '../styles/views/shipments-list';
</style>
