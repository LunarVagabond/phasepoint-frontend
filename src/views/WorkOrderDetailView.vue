<template>
  <div class="work-order-detail" :class="{ 'work-order-detail--completed': workOrder?.status === 'COMPLETED' }">
    <div v-if="loading" class="loading">Loading…</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="workOrder" class="work-order-content">
      <div v-if="workOrder.status === 'COMPLETED'" class="completed-banner" role="status" aria-live="polite">
        <span class="completed-banner__icon" aria-hidden="true">✓</span>
        <span class="completed-banner__text">This work order is complete.</span>
        <span v-if="workOrder.completed_at" class="completed-banner__date">Completed {{ formatDate(workOrder.completed_at) }}</span>
      </div>
      <p v-if="!isAssignedToMe" class="read-only-banner">
        View only. This work order is assigned to {{ workOrder.assigned_to_username }}. You can only take actions on work orders assigned to you.
      </p>
      <header class="work-order-header">
        <div>
          <h1>{{ workOrder.work_order_number }}</h1>
          <p class="work-order-meta">
            Status: <span class="badge">{{ workOrder.status }}</span>
            • Assigned to: {{ workOrder.assigned_to_username }}
            • {{ workOrder.asset_count }} asset{{ workOrder.asset_count !== 1 ? 's' : '' }}
          </p>
        </div>
        <div class="header-actions">
          <button
            v-if="isAssignedToMe && workOrder.status === 'COMPLETED'"
            type="button"
            class="btn-primary btn-generate-certificate"
            @click="generateCertificate"
          >
            Generate Certificate
          </button>
          <button
            v-if="isAssignedToMe && canCompleteWorkOrder && workOrder.status !== 'COMPLETED' && workOrder.status !== 'CANCELLED'"
            type="button"
            class="btn-primary btn-complete"
            :disabled="completing"
            @click="completeWorkOrder"
          >
            {{ completing ? 'Completing…' : 'Complete Work Order' }}
          </button>
          <button type="button" class="btn-secondary" @click="$router.back()">Back</button>
        </div>
      </header>

      <section class="work-order-info-section">
        <h2>Work Order Information</h2>
        <table class="detail-table">
          <tbody>
            <tr>
              <th scope="row">Work Order Number</th>
              <td>{{ workOrder.work_order_number }}</td>
            </tr>
            <tr>
              <th scope="row">Status</th>
              <td><span class="badge">{{ workOrder.status }}</span></td>
            </tr>
            <tr>
              <th scope="row">Assigned To</th>
              <td>{{ workOrder.assigned_to_username }}</td>
            </tr>
            <tr>
              <th scope="row">Intended Action</th>
              <td>{{ workOrder.intended_action }}</td>
            </tr>
            <tr>
              <th scope="row">Customers</th>
              <td>{{ workOrder.customer_names.join(', ') || '—' }}</td>
            </tr>
            <tr>
              <th scope="row">Created</th>
              <td>{{ formatDate(workOrder.created_at) }}</td>
            </tr>
            <tr v-if="workOrder.completed_at">
              <th scope="row">Completed</th>
              <td>{{ formatDate(workOrder.completed_at) }}</td>
            </tr>
            <tr v-if="workOrder.notes">
              <th scope="row">Notes</th>
              <td class="detail-notes">{{ workOrder.notes }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-if="workOrder.location_summary && Object.keys(workOrder.location_summary).length" class="summary-section">
        <h2>Location Summary</h2>
        <div class="summary-grid">
          <div v-for="(loc, key) in workOrder.location_summary" :key="key" class="summary-item">
            <span class="summary-label">{{ loc.label }}:</span>
            <span class="summary-value">{{ loc.count }}</span>
          </div>
        </div>
      </section>

      <section v-if="workOrder.sanitization_summary" class="summary-section">
        <h2>Sanitization Summary</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Passed:</span>
            <span class="summary-value">{{ workOrder.sanitization_summary.passed || 0 }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Failed:</span>
            <span class="summary-value">{{ workOrder.sanitization_summary.failed || 0 }}</span>
          </div>
        </div>
      </section>

      <section class="shipments-section">
        <h2>Shipments ({{ (workOrder.shipments || []).length }})</h2>
        <div v-if="(workOrder.shipments || []).length" class="shipments-table-container">
          <table class="detail-table shipments-table">
            <thead>
              <tr>
                <th>Carrier</th>
                <th>Tracking</th>
                <th>Shipped</th>
                <th>Destination</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="s in (workOrder.shipments || [])"
                :key="s.id"
                class="shipment-row-clickable"
                role="button"
                tabindex="0"
                @click="goToShipment(s.id)"
                @keydown.enter.space.prevent="goToShipment(s.id)"
              >
                <td>{{ s.carrier || '—' }}</td>
                <td>{{ s.tracking_number || '—' }}</td>
                <td>{{ formatDate(s.shipped_at) }}</td>
                <td>{{ s.destination_type || '—' }}</td>
                <td class="detail-notes">{{ s.notes || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="workOrder.status !== 'COMPLETED' && workOrder.status !== 'CANCELLED'" class="shipment-add-form">
          <h3 class="shipment-add-title">Add shipment</h3>
          <div class="shipment-form-row">
            <label for="shipment-carrier">Carrier</label>
            <input id="shipment-carrier" v-model="newShipment.carrier" type="text" class="text-input" placeholder="e.g. FedEx" />
          </div>
          <div class="shipment-form-row">
            <label for="shipment-tracking">Tracking number</label>
            <input id="shipment-tracking" v-model="newShipment.tracking_number" type="text" class="text-input" placeholder="Tracking #" />
          </div>
          <div class="shipment-form-row">
            <label for="shipment-destination">Destination type</label>
            <select id="shipment-destination" v-model="newShipment.destination_type" class="text-input">
              <option value="">—</option>
              <option v-for="d in SHIPMENT_DESTINATION_TYPES" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>
          <div class="shipment-form-row">
            <label for="shipment-notes">Notes</label>
            <textarea id="shipment-notes" v-model="newShipment.notes" class="text-input" rows="2" placeholder="Optional" />
          </div>
          <button
            type="button"
            class="btn-primary"
            :disabled="shipmentSubmitting"
            @click="submitShipment"
          >
            {{ shipmentSubmitting ? 'Adding…' : 'Add shipment' }}
          </button>
          <p v-if="shipmentError" class="error">{{ shipmentError }}</p>
        </div>
      </section>

      <section class="assets-section">
        <h2>Assets ({{ workOrder.assets.length }})</h2>
        <div class="assets-table-container">
          <table class="assets-table">
            <thead>
              <tr>
                <th>Internal ID</th>
                <th>Manufacturer / Model</th>
                <th>Serial Number</th>
                <th>Status</th>
                <th>Location</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="asset in assetsTableData" :key="asset.id">
                <td><strong>{{ asset.internal_asset_id }}</strong></td>
                <td>{{ asset.manufacturer_model || '—' }}</td>
                <td>{{ asset.serial_number || '—' }}</td>
                <td><span class="badge">{{ asset.status }}</span></td>
                <td>{{ asset.location }}</td>
                <td>
                  <!-- Show dropdown only if assigned to me, at WIPE_STATION, no record yet, and work order not completed -->
                  <select
                    v-if="isAssignedToMe && asset.locationValue === 'WIPE_STATION' && !asset.latest_sanitization_record_id && workOrder.status !== 'COMPLETED' && workOrder.status !== 'CANCELLED'"
                    v-model="sanitizationData[asset.id].sanitization_result"
                    class="text-input sanitization-result-select"
                    :disabled="submitting"
                  >
                    <option value="">No change</option>
                    <option value="PASS">PASS</option>
                    <option value="FAIL">FAIL</option>
                  </select>
                  <!-- Show sanitization result if record exists -->
                  <div v-else-if="asset.latest_sanitization_record_id" class="sanitization-result-display">
                    <span :class="['sanitization-badge', asset.latest_sanitization_result === 'PASS' ? 'badge-pass' : 'badge-fail']">
                      {{ asset.latest_sanitization_result === 'PASS' ? 'PASSED' : 'FAILED' }}
                    </span>
                    <span class="sanitization-record-id">({{ asset.latest_sanitization_record_id.slice(0, 8) }}...)</span>
                  </div>
                  <span v-else class="sanitization-status">—</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="isAssignedToMe && hasSanitizationChanges && workOrder.status !== 'COMPLETED' && workOrder.status !== 'CANCELLED'" class="sanitization-actions">
            <button
              type="button"
              class="btn-primary"
              :disabled="submitting"
              @click="submitSanitization"
            >
              {{ submitting ? 'Recording…' : 'Record Sanitization Results' }}
            </button>
            <p v-if="sanitizationError" class="error">{{ sanitizationError }}</p>
            <p v-if="sanitizationSuccess" class="success">{{ sanitizationSuccess }}</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getWorkOrder, recordWorkOrderSanitization, updateWorkOrder, getMe, createShipment, SHIPMENT_DESTINATION_TYPES, type WorkOrderDetail, type AssetSummary } from '../api'

const route = useRoute()
const router = useRouter()
const me = ref<Awaited<ReturnType<typeof getMe>> | null>(null)
const workOrder = ref<WorkOrderDetail | null>(null)
const loading = ref(true)
const error = ref('')
const submitting = ref(false)
const completing = ref(false)
const sanitizationError = ref('')
const sanitizationSuccess = ref('')
const sanitizationData = ref<Record<string, {
  sanitization_result: 'PASS' | 'FAIL' | ''
}>>({})
const newShipment = ref({ carrier: '', tracking_number: '', destination_type: '', notes: '' })
const shipmentSubmitting = ref(false)
const shipmentError = ref('')

const ASSET_LOCATIONS = [
  { value: 'INTAKE', label: 'Intake' },
  { value: 'DIRTY_CAGE', label: 'Dirty Cage' },
  { value: 'WIPE_STATION', label: 'Wipe Station' },
  { value: 'CLEAN_CAGE', label: 'Clean Cage' },
  { value: 'DESTRUCTION', label: 'Destruction' },
  { value: 'SHIPPED', label: 'Shipped' },
]

const assetsTableData = computed(() => {
  if (!workOrder.value) return []
  return workOrder.value.assets.map(asset => ({
    ...asset,
    location: ASSET_LOCATIONS.find(loc => loc.value === asset.location)?.label || asset.location,
    // Store original location value for filtering
    locationValue: asset.location,
    // Include sanitization record info from API
    latest_sanitization_record_id: (asset as any).latest_sanitization_record_id,
    latest_sanitization_result: (asset as any).latest_sanitization_result,
  }))
})

const hasSanitizationChanges = computed(() => {
  return Object.values(sanitizationData.value).some(data => 
    data.sanitization_result === 'PASS' || data.sanitization_result === 'FAIL'
  )
})

const isAssignedToMe = computed(() => {
  if (!me.value || !workOrder.value) return false
  return String(workOrder.value.assigned_to) === String(me.value.id)
})

const canCompleteWorkOrder = computed(() => {
  if (!workOrder.value) return false
  if (workOrder.value.status === 'COMPLETED' || workOrder.value.status === 'CANCELLED') return false
  if (workOrder.value.assets.length === 0) return false
  
  // Check if all assets are at final destinations:
  // - Status: DESTROYED, RELEASED
  // - Location: SHIPPED (for shipped/released assets)
  // - Location: DESTRUCTION (for destroyed assets)
  const allAtFinalDestinations = workOrder.value.assets.every(asset => {
    // Assets are complete if they're destroyed, released, or shipped
    return asset.status === 'DESTROYED' || 
           asset.status === 'RELEASED' ||
           asset.location === 'SHIPPED' ||
           (asset.status === 'DESTROYED' && asset.location === 'DESTRUCTION')
  })
  return allAtFinalDestinations
})

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function goToShipment(shipmentId: string) {
  router.push(`/employee-portal/shipments/${shipmentId}`)
}

function initializeSanitizationData() {
  if (!workOrder.value) return
  const data: Record<string, {
    sanitization_result: 'PASS' | 'FAIL' | ''
  }> = {}
  // Initialize for all assets at WIPE_STATION that don't have sanitization records yet
  workOrder.value.assets.forEach(asset => {
    if (asset.location === 'WIPE_STATION' && !(asset as any).latest_sanitization_record_id) {
      data[asset.id] = {
        sanitization_result: '',
      }
    }
  })
  sanitizationData.value = data
}

async function submitSanitization() {
  if (!workOrder.value) return
  submitting.value = true
  sanitizationError.value = ''
  sanitizationSuccess.value = ''

  try {
    // Only process rows with PASS or FAIL (skip "No change")
    const assetSanitizations = Object.entries(sanitizationData.value)
      .filter(([_, data]) => data.sanitization_result === 'PASS' || data.sanitization_result === 'FAIL')
      .map(([assetId, data]) => ({
        asset_id: assetId,
        sanitization_result: data.sanitization_result as 'PASS' | 'FAIL',
        sanitization_method: undefined,
        sanitization_tool: undefined,
        location: undefined,
      }))

    if (assetSanitizations.length === 0) {
      sanitizationError.value = 'Please select PASS or FAIL for at least one asset.'
      return
    }

    const result = await recordWorkOrderSanitization(workOrder.value.id, {
      asset_sanitizations: assetSanitizations,
    })

    if (result.errors && result.errors.length > 0) {
      sanitizationError.value = result.errors.join('; ')
    } else {
      sanitizationSuccess.value = `Successfully recorded sanitization for ${result.processed.length} asset(s).`
      // Reload work order data
      await loadWorkOrder()
      // Reset sanitization data after a delay
      setTimeout(() => {
        sanitizationSuccess.value = ''
        initializeSanitizationData()
      }, 2000)
    }
  } catch (e) {
    sanitizationError.value = e instanceof Error ? e.message : 'Failed to record sanitization'
  } finally {
    submitting.value = false
  }
}

async function submitShipment() {
  if (!workOrder.value) return
  shipmentSubmitting.value = true
  shipmentError.value = ''
  try {
    await createShipment(workOrder.value.id, {
      carrier: newShipment.value.carrier.trim() || undefined,
      tracking_number: newShipment.value.tracking_number.trim() || undefined,
      destination_type: newShipment.value.destination_type.trim() || undefined,
      notes: newShipment.value.notes.trim() || undefined,
    })
    newShipment.value = { carrier: '', tracking_number: '', destination_type: '', notes: '' }
    await loadWorkOrder()
  } catch (e) {
    shipmentError.value = e instanceof Error ? e.message : 'Failed to add shipment'
  } finally {
    shipmentSubmitting.value = false
  }
}

async function completeWorkOrder() {
  if (!workOrder.value || !canCompleteWorkOrder.value) return
  completing.value = true
  error.value = ''

  try {
    await updateWorkOrder(workOrder.value.id, { status: 'COMPLETED' })
    await loadWorkOrder()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to complete work order'
  } finally {
    completing.value = false
  }
}

function generateCertificate() {
  if (!workOrder.value) return
  
  // For now, just log certificate data to console
  // Later this will call an API endpoint to generate PDF
  const certificateData = {
    certifiedBy: 'Phasepoint',
    company: workOrder.value.customer_names.join(', ') || 'N/A',
    date: new Date().toLocaleDateString(),
    workOrderNumber: workOrder.value.work_order_number,
    assets: workOrder.value.assets.map(asset => ({
      internalAssetId: asset.internal_asset_id,
      manufacturerModel: asset.manufacturer_model,
      serialNumber: asset.serial_number,
      status: asset.status,
      location: asset.location,
      sanitizationResult: (asset as any).latest_sanitization_result || null,
      sanitizationRecordId: (asset as any).latest_sanitization_record_id || null,
    })),
    sanitizationSummary: workOrder.value.sanitization_summary,
    locationSummary: workOrder.value.location_summary,
  }
  
  console.log('=== CERTIFICATE DATA ===')
  console.log(JSON.stringify(certificateData, null, 2))
  console.log('=== END CERTIFICATE DATA ===')
  
  // TODO: Call API endpoint to generate PDF certificate
  // await generateWorkOrderCertificate(workOrder.value.id)
}

async function loadWorkOrder() {
  const id = route.params.id as string
  if (!id) {
    error.value = 'Work order ID is required'
    loading.value = false
    return
  }

  loading.value = true
  error.value = ''
  try {
    workOrder.value = await getWorkOrder(id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load work order'
  } finally {
    loading.value = false
  }
}

watch(() => workOrder.value, () => {
  if (workOrder.value) {
    initializeSanitizationData()
  }
}, { immediate: true })

onMounted(async () => {
  try {
    me.value = await getMe()
  } catch {
    // not authenticated or failed
  }
  loadWorkOrder()
})
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.shipment-row-clickable {
  cursor: pointer;
}
.shipment-row-clickable:hover {
  background: var(--color-bg-subtle, rgba(0 0 0 / 0.03));
}
.shipment-row-clickable:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}
</style>
