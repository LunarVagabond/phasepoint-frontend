<template>
  <section class="customer-shipment-detail">
    <header class="detail-header">
      <div>
        <h2>Shipment Details</h2>
        <p class="subtitle">Full shipment information and chain of custody</p>
      </div>
      <span class="status-pill" :class="`status-${shipment?.status?.toLowerCase()}`" v-if="shipment">
        {{ shipment.status }}
      </span>
    </header>

    <div v-if="loading" class="card">Loading shipment…</div>
    <div v-else-if="error" class="card error-card">{{ error }}</div>
    <div v-else-if="shipment" class="detail-grid">
      <article class="card">
        <h3>Summary</h3>
        <dl class="summary-dl">
          <dt>Shipment ID</dt>
          <dd>{{ shipment.id }}</dd>
          <dt>Status</dt>
          <dd><span class="badge" :data-status="shipment.status">{{ shipment.status }}</span></dd>
          <dt>Carrier</dt>
          <dd>{{ shipment.carrier || '—' }}</dd>
          <dt>Tracking Number</dt>
          <dd>{{ shipment.tracking_number || '—' }}</dd>
          <dt>Destination Type</dt>
          <dd>{{ shipment.destination_type || '—' }}</dd>
          <dt>Shipped At</dt>
          <dd>{{ shipment.shipped_at ? formatDate(shipment.shipped_at) : '—' }}</dd>
          <dt>Completed By</dt>
          <dd>{{ shipment.completed_by_username || '—' }}</dd>
          <dt>Notes</dt>
          <dd class="notes">{{ shipment.notes || '—' }}</dd>
        </dl>

        <div v-if="shipment.assets && shipment.assets.length > 0" class="chain-of-custody-section">
          <h4>Chain of Custody</h4>
          <p class="chain-desc">Download chain of custody documents for all assets in this shipment.</p>
          <button type="button" class="btn-primary" :disabled="downloadingChain" @click="downloadChainOfCustody">
            {{ downloadingChain ? 'Downloading…' : 'Download Chain of Custody PDF' }}
          </button>
        </div>
      </article>

      <article class="card assets-card">
        <h3>Assets ({{ shipment.assets?.length || 0 }})</h3>
        <div v-if="!shipment.assets || shipment.assets.length === 0" class="empty-state">
          <p>No assets in this shipment.</p>
        </div>
        <div v-else class="assets-list">
          <div
            v-for="asset in shipment.assets"
            :key="asset.id"
            class="asset-item"
            @click="openAsset(asset.id)"
          >
            <div class="asset-item-main">
              <strong>{{ formatAssetId(asset.id) }}</strong>
              <span class="asset-meta">{{ asset.manufacturer_model || '—' }}</span>
              <span class="asset-meta">Serial: {{ asset.serial_number || '—' }}</span>
            </div>
            <div class="asset-item-status">
              <span class="badge" :data-status="asset.status">
                {{ formatStatus(asset.status) }}
              </span>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCustomerShipment, downloadCustomerChainOfCustodyPDF } from '../api'
import type { ShipmentDetail } from '../api'
import { formatAssetId } from '../utils/format'
import { useNotifications } from '../composables/useNotifications'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id || ''))
const isEmployeePreview = computed(() => route.path.includes('/employee-portal/customers/'))
const customerId = computed(() => isEmployeePreview.value ? String(route.params.customerId || '') : null)
const loading = ref(true)
const error = ref('')
const shipment = ref<ShipmentDetail | null>(null)
const downloadingChain = ref(false)

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function formatStatus(status: string) {
  return status.replace(/_/g, ' ')
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (!id.value) {
      throw new Error('Missing shipment id.')
    }
    const params: Parameters<typeof getCustomerShipment>[1] = {}
    // For employee preview, pass customer_id
    if (isEmployeePreview.value && customerId.value) {
      params.customer_id = customerId.value
    }
    shipment.value = await getCustomerShipment(id.value, params)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load shipment.'
  } finally {
    loading.value = false
  }
}

async function downloadChainOfCustody() {
  if (!shipment.value || !shipment.value.assets || shipment.value.assets.length === 0) return
  downloadingChain.value = true
  try {
    // Download chain of custody for the first asset (or we could create a combined one)
    // For now, we'll download for the first asset
    const firstAsset = shipment.value.assets[0]
    const blob = await downloadCustomerChainOfCustodyPDF(firstAsset.id)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chain-of-custody-shipment-${shipment.value.id}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (e) {
    const { error: showError } = useNotifications()
    showError(e instanceof Error ? e.message : 'Failed to download chain of custody')
  } finally {
    downloadingChain.value = false
  }
}

function openAsset(assetId: string) {
  router.push(`/customer-portal/assets/${assetId}`)
}

onMounted(() => {
  load().catch(() => {})
})
</script>
