<template>
  <section class="customer-shipments">
    <header class="page-header">
      <h2>My Shipments</h2>
      <p class="subtitle">Track all shipments containing your assets</p>
    </header>

    <div v-if="loading" class="loading-state">Loading shipments…</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>
    <div v-else-if="shipments.length === 0" class="empty-state">
      <p>No shipments found.</p>
    </div>
    <div v-else class="shipments-table-wrap">
      <table class="shipments-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Carrier</th>
            <th>Tracking Number</th>
            <th>Destination</th>
            <th>Asset Count</th>
            <th>Shipped At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="shipment in shipments"
            :key="shipment.id"
            class="shipment-row"
            @click="openDetail(shipment.id)"
          >
            <td>
              <span class="badge" :data-status="shipment.status">
                {{ shipment.status }}
              </span>
            </td>
            <td>{{ shipment.carrier || '—' }}</td>
            <td>{{ shipment.tracking_number || '—' }}</td>
            <td>{{ shipment.destination_type || '—' }}</td>
            <td>{{ shipment.asset_count }}</td>
            <td>{{ shipment.shipped_at ? formatDate(shipment.shipped_at) : '—' }}</td>
            <td>
              <button type="button" class="btn-link" @click.stop="openDetail(shipment.id)">View</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCustomerShipments } from '../api'
import type { ShipmentListSummary } from '../api'

const route = useRoute()
const router = useRouter()

const isEmployeePreview = computed(() => route.path.includes('/employee-portal/customers/'))
const customerId = computed(() => isEmployeePreview.value ? String(route.params.customerId || '') : null)

const shipments = ref<ShipmentListSummary[]>([])
const loading = ref(true)
const error = ref('')

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const params: Parameters<typeof getCustomerShipments>[0] = {}
    // For employee preview, pass customer_id
    if (isEmployeePreview.value && customerId.value) {
      params.customer_id = customerId.value
    }
    shipments.value = await getCustomerShipments(params)
  } catch (e) {
    // If empty shipments, show empty state instead of error
    const errorMsg = e instanceof Error ? e.message : 'Failed to load shipments'
    if (errorMsg.includes('404') || errorMsg.includes('Not found') || errorMsg.includes('empty')) {
      shipments.value = []
      error.value = ''
    } else {
      error.value = errorMsg
    }
  } finally {
    loading.value = false
  }
}

function openDetail(id: string) {
  const basePath = route.path.includes('/employee-portal/customers/')
    ? `/employee-portal/customers/${String(route.params.customerId || '')}/portal`
    : '/customer-portal'
  const underTracking = route.path.includes('/tracking/')
  const path = underTracking ? `${basePath}/tracking/shipments/${id}` : `${basePath}/shipments/${id}`
  router.push(path)
}

onMounted(() => {
  load()
})
</script>
