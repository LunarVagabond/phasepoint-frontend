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
            Status: <span class="badge" :data-status="workOrder.status">{{ workOrder.status }}</span>
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
            <td>
              <div v-if="isEmployee && isAssignedToMe && workOrder.status !== 'COMPLETED'" class="status-select-wrapper">
                <select
                  v-model="workOrderStatusEdit"
                  :disabled="savingStatus"
                  class="status-select"
                  :class="`status-select--${workOrderStatusEdit.toLowerCase().replace('_', '-')}`"
                  @change="updateWorkOrderStatus"
                >
                  <option
                    v-for="opt in allowedStatusOptions"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>
                <span v-if="savingStatus" class="status-saving-indicator">Saving…</span>
              </div>
              <span v-else class="badge" :data-status="workOrder.status">{{ formatStatusLabel(workOrder.status) }}</span>
            </td>
            </tr>
            <tr>
              <th scope="row">Assigned To</th>
              <td>
                <div v-if="isEmployee && isAssignedToMe && workOrder.status !== 'COMPLETED'" class="assigned-to-select-wrapper">
                  <FilterableSelect
                    v-model="workOrderAssignedToEdit"
                    :options="employeeSelectOptions"
                    placeholder="— Select employee —"
                    search-placeholder="Search employees…"
                    class="assigned-to-select"
                    @update:modelValue="updateWorkOrderAssignedTo"
                  />
                  <span v-if="savingAssignedTo" class="assigned-to-saving-indicator">Saving…</span>
                </div>
                <span v-else>{{ workOrder.assigned_to_username }}</span>
              </td>
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
        <div v-if="isAssignedToMe && workOrder.status !== 'COMPLETED' && workOrder.status !== 'CANCELLED'" class="work-order-notes-edit">
          <h3 class="notes-edit-title">Employee notes</h3>
          <textarea
            v-model="workOrderNotesEdit"
            class="text-input notes-textarea"
            rows="3"
            placeholder="Add notes about this work order (internal use)…"
          />
          <button
            type="button"
            class="btn-primary btn-save-notes"
            :disabled="savingNotes || workOrderNotesEdit === (workOrder.notes || '')"
            @click="saveWorkOrderNotes"
          >
            {{ savingNotes ? 'Saving…' : 'Save notes' }}
          </button>
          <p v-if="notesError" class="error">{{ notesError }}</p>
        </div>
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
        <div class="shipments-section-header">
          <h2>Shipments ({{ (workOrder.shipments || []).length }})</h2>
          <p v-if="workOrder.status !== 'COMPLETED' && workOrder.status !== 'CANCELLED' && !hasEligibleShipmentAssets && (workOrder.shipments || []).length === 0" class="shipment-hint">
            No assets ready for shipment. Assets must be in Clean Cage with Sanitized (Pass) status.
          </p>
          <p v-if="workOrder.status !== 'COMPLETED' && workOrder.status !== 'CANCELLED' && hasEligibleShipmentAssets && openShipments.length === 0" class="shipment-hint">
            <router-link to="/employee-portal/shipments">Create a Shipment here</router-link> to add assets to.
          </p>
        </div>
        <div v-if="(workOrder.shipments || []).length" class="shipments-table-container">
          <table class="detail-table shipments-table">
            <thead>
              <tr>
                <th>Carrier</th>
                <th>Tracking</th>
                <th>Shipped</th>
                <th>Destination Type</th>
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
                <td>
                  <span v-if="s.status === 'SHIPPED'" class="status-indicator shipped" title="Shipped"></span>
                  <span v-else class="status-indicator draft" title="Draft"></span>
                  {{ s.carrier || '—' }}
                </td>
                <td>{{ s.tracking_number || '—' }}</td>
                <td>{{ s.shipped_at ? formatDate(s.shipped_at) : '—' }}</td>
                <td>{{ s.destination_type || '—' }}</td>
                <td>{{ s.destination_address || '—' }}</td>
                <td class="detail-notes">{{ s.notes || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Add Assets to Shipment Section (only when there are open shipments to add to) -->
        <div v-if="hasEligibleShipmentAssets && openShipments.length > 0 && workOrder.status !== 'COMPLETED' && workOrder.status !== 'CANCELLED'" class="shipment-asset-selector">
          <h3>Add Assets to Shipment</h3>
          <button
            v-if="!showShipmentAssetSelector"
            type="button"
            class="btn-secondary"
            @click="showShipmentAssetSelector = true"
          >
            Select assets to add to shipment
          </button>
          <div v-if="showShipmentAssetSelector" class="shipment-asset-form">
            <div class="form-row">
              <label for="select-shipment">Select Shipment</label>
              <select
                id="select-shipment"
                v-model="selectedShipmentId"
                class="text-input"
                :disabled="shipmentAssetSubmitting"
              >
                <option value="">— Select a shipment —</option>
                <option
                  v-for="s in openShipments"
                  :key="s.id"
                  :value="s.id"
                >
                  {{ s.carrier || 'No carrier' }} - {{ s.tracking_number || 'No tracking' }}
                </option>
              </select>
            </div>
            <div v-if="selectedShipmentId" class="eligible-assets-list">
              <p class="form-hint">Select assets to add to shipment (only SANITIZED_PASS @ CLEAN_CAGE assets shown):</p>
              <div class="assets-checkbox-list">
                <label
                  v-for="asset in eligibleShipmentAssets"
                  :key="asset.id"
                  class="asset-checkbox-label"
                >
                  <input
                    type="checkbox"
                    :checked="selectedAssetsForShipment.includes(asset.id)"
                    :disabled="shipmentAssetSubmitting || asset.shipment_id !== null"
                    @change="toggleAssetForShipment(asset.id)"
                  />
                  <span>
                    <strong>{{ formatAssetId(asset.id) }}</strong>
                    {{ asset.manufacturer_model || '—' }} / {{ asset.serial_number || '—' }}
                    <span v-if="asset.shipment_id !== null" class="already-in-shipment">(already in shipment)</span>
                  </span>
                </label>
              </div>
            </div>
            <div v-if="selectedShipmentId && selectedAssetsForShipment.length > 0" class="shipment-asset-actions">
              <button
                type="button"
                class="btn-primary"
                :disabled="shipmentAssetSubmitting"
                @click="submitAddAssetsToShipment"
              >
                {{ shipmentAssetSubmitting ? 'Adding…' : `Add ${selectedAssetsForShipment.length} asset(s) to shipment` }}
              </button>
              <button
                type="button"
                class="btn-secondary"
                :disabled="shipmentAssetSubmitting"
                @click="clearShipmentAssetSelection"
              >
                Cancel
              </button>
            </div>
            <p v-if="shipmentAssetError" class="error">{{ shipmentAssetError }}</p>
            <p v-if="shipmentAssetSuccess" class="success">{{ shipmentAssetSuccess }}</p>
          </div>
        </div>
      </section>

      <section class="assets-section">
        <h2>Assets ({{ workOrder.assets.length }})</h2>
        <div class="assets-table-container">
          <table class="assets-table">
            <thead>
              <tr>
                <th v-if="isAssignedToMe && workOrder.status !== 'COMPLETED' && workOrder.status !== 'CANCELLED' && showManualMovement">
                  <input
                    type="checkbox"
                    :checked="allAssetsSelected"
                    :indeterminate="someAssetsSelected"
                    @change="toggleAllAssets"
                    class="asset-checkbox"
                  />
                </th>
                <th>Asset ID</th>
                <th>Manufacturer / Model</th>
                <th>Serial Number</th>
                <th>Status</th>
                <th>Location</th>
                <th>Result</th>
                <th v-if="isEmployee && workOrder.status !== 'COMPLETED' && workOrder.status !== 'CANCELLED'">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="asset in assetsTableData" :key="asset.id">
                <td v-if="isAssignedToMe && workOrder.status !== 'COMPLETED' && workOrder.status !== 'CANCELLED' && showManualMovement">
                  <input
                    type="checkbox"
                    :checked="selectedAssets.includes(asset.id)"
                    @change="toggleAsset(asset.id)"
                    class="asset-checkbox"
                    :disabled="!canMoveAsset(asset)"
                  />
                </td>
                <td><strong>{{ formatAssetId(asset.id) }}</strong></td>
                <td>{{ asset.manufacturer_model || '—' }}</td>
                <td>{{ asset.serial_number || '—' }}</td>
                <td><span class="badge" :data-status="asset.status">{{ asset.status }}</span></td>
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
                <td v-if="isEmployee && workOrder.status !== 'COMPLETED' && workOrder.status !== 'CANCELLED'">
                  <button
                    type="button"
                    class="btn-secondary btn-sm"
                    :disabled="removingAssetId === asset.id"
                    @click="removeAssetFromWorkOrderHandler(asset.id)"
                    title="Remove asset from work order"
                  >
                    {{ removingAssetId === asset.id ? 'Removing…' : 'Remove' }}
                  </button>
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
        
        <!-- Manual Asset Movement Section -->
        <div v-if="isAssignedToMe && workOrder.status !== 'COMPLETED' && workOrder.status !== 'CANCELLED'" class="manual-movement-section">
          <h3>Skip Kiosk</h3>
          <p class="manual-movement-description">Move assets without using a kiosk. Assets are automatically grouped by their next valid transition.</p>
          
          <div v-if="selectedAssets.length > 0" class="manual-movement-form">
            <!-- Show transition groups -->
            <div v-if="Object.keys(selectedAssetsByTransition).length > 0" class="transition-groups">
              <div 
                v-for="(group, transitionKey) in selectedAssetsByTransition" 
                :key="transitionKey" 
                class="transition-group"
                :style="{ borderLeftColor: group.borderColor, borderLeftWidth: '4px', borderLeftStyle: 'solid' }"
              >
                <div class="transition-group-header">
                  <div class="transition-header-main">
                    <button
                      type="button"
                      class="transition-toggle-btn"
                      @click="toggleTransitionGroup(transitionKey)"
                      :aria-expanded="expandedTransitionGroups.has(transitionKey)"
                    >
                      <span class="toggle-icon" :class="{ expanded: expandedTransitionGroups.has(transitionKey) }">▶</span>
                      <strong>{{ group.assetIds.length }} asset(s)</strong>
                      <span v-if="group.transition" class="transition-label">
                        {{ group.transition.fromStatus }} @ {{ group.transition.fromLocation }} → 
                        {{ group.transition.toStatus }} @ {{ group.transition.toLocation }}
                      </span>
                      <span v-else class="transition-label error-text">
                        No valid transition available
                      </span>
                    </button>
                    <!-- Inline input for release destination -->
                    <div v-if="group.transition && group.transition.requiresReleaseDestination" class="transition-input-inline">
                      <label :for="`release-destination-${transitionKey}`" class="sr-only">Release Destination</label>
                      <select
                        :id="`release-destination-${transitionKey}`"
                        v-model="manualMovement.release_destination"
                        class="text-input text-input-inline"
                        :disabled="manualMovementSubmitting"
                      >
                        <option value="">Select destination</option>
                        <option value="Re-sale">Re-sale</option>
                        <option value="Recycler">Recycler</option>
                        <option value="Other">Other</option>
                      </select>
                      <input
                        v-if="manualMovement.release_destination === 'Other'"
                        v-model="manualMovement.other_destination"
                        type="text"
                        class="text-input text-input-inline"
                        placeholder="Specify destination"
                        :disabled="manualMovementSubmitting"
                      />
                    </div>
                    <!-- Shipment selection for CLEAN_CAGE -> SHIPMENT_STAGING_AREA transitions -->
                    <div v-if="group.transition && group.transition.requiresShipmentSelection" class="transition-input-inline">
                      <label :for="`shipment-selection-${transitionKey}`" class="sr-only">Select Shipment</label>
                      <div ref="shipmentDropdownWrapper" class="shipment-select-wrapper">
                        <input
                          :id="`shipment-selection-${transitionKey}`"
                          v-model="manualMovement.shipmentSearchQuery"
                          type="text"
                          class="text-input shipment-search-input"
                          :placeholder="selectedShipmentDisplay || 'Search shipments...'"
                          :disabled="manualMovementSubmitting"
                          @focus="showShipmentDropdown = true"
                          @input="filterShipments"
                        />
                        <div v-if="showShipmentDropdown && filteredShipmentsForSelection.length > 0" class="shipment-dropdown">
                          <div
                            v-for="shipment in filteredShipmentsForSelection"
                            :key="shipment.id"
                            class="shipment-option"
                            :class="{ selected: manualMovement.selectedShipmentId === shipment.id }"
                            @click="selectShipment(shipment.id)"
                          >
                            <div class="shipment-option-main">
                              <span class="shipment-carrier">{{ shipment.carrier || 'No carrier' }}</span>
                              <span v-if="shipment.tracking_number" class="shipment-tracking">({{ shipment.tracking_number }})</span>
                            </div>
                            <div v-if="shipment.destination_address" class="shipment-address">{{ shipment.destination_address }}</div>
                          </div>
                        </div>
                        <div v-if="showShipmentDropdown && filteredShipmentsForSelection.length === 0" class="shipment-dropdown">
                          <div class="shipment-option no-results">No shipments found</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Collapsible asset details -->
                <div v-if="expandedTransitionGroups.has(transitionKey)" class="transition-assets-list">
                  <div v-for="assetId in group.assetIds" :key="assetId" class="transition-asset-item">
                    <span class="asset-id">{{ formatAssetId(assetId) }}</span>
                    <span class="asset-details">
                      {{ workOrder?.assets.find(a => a.id === assetId)?.manufacturer_model || '—' }} / 
                      {{ workOrder?.assets.find(a => a.id === assetId)?.serial_number || '—' }}
                      <span class="asset-state">
                        ({{ workOrder?.assets.find(a => a.id === assetId)?.status }} @ {{ workOrder?.assets.find(a => a.id === assetId)?.location }})
                      </span>
                    </span>
                  </div>
                </div>
                <div v-if="!group.transition" class="transition-warning">
                  <p class="error">These assets cannot be moved - they have no valid transition from their current state.</p>
                </div>
              </div>
            </div>
            <div v-else class="transition-error">
              <p class="error">Selected assets cannot be moved together. They have incompatible states or no valid transitions.</p>
            </div>
            <div class="manual-movement-actions">
              <button
                type="button"
                class="btn-primary"
                :disabled="manualMovementSubmitting || !canSubmitManualMovement || Object.keys(selectedAssetsByTransition).length === 0"
                @click="submitManualMovement"
              >
                {{ manualMovementSubmitting ? 'Moving…' : 'Skip Kiosk' }}
              </button>
              <button
                type="button"
                class="btn-secondary"
                :disabled="manualMovementSubmitting"
                @click="clearManualMovementSelection"
              >
                Clear Selection
              </button>
            </div>
            <p v-if="manualMovementError" class="error">{{ manualMovementError }}</p>
            <p v-if="manualMovementSuccess" class="success">{{ manualMovementSuccess }}</p>
          </div>
          <p v-else class="manual-movement-hint">Select assets above to move them manually. Assets will be grouped by their next valid transition.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getWorkOrder, recordWorkOrderSanitization, updateWorkOrder, getMe, confirmWorkOrder, addAssetToShipment, getShipments, getUsersByType, removeAssetFromWorkOrder, type WorkOrderDetail, type AssetSummary, type UserSummary } from '../api'
import { formatAssetId } from '../utils/format'
import { useAuth } from '../composables/useAuth'
import { useNotifications } from '../composables/useNotifications'
import FilterableSelect from '../components/FilterableSelect.vue'
import type { FilterableOption } from '../components/FilterableSelect.vue'

const route = useRoute()
const router = useRouter()
const { isEmployee } = useAuth()
const { error: showError } = useNotifications()
const me = ref<Awaited<ReturnType<typeof getMe>> | null>(null)
const workOrder = ref<WorkOrderDetail | null>(null)
const workOrderStatusEdit = ref('')
const savingStatus = ref(false)
const workOrderAssignedToEdit = ref('')
const savingAssignedTo = ref(false)
const employees = ref<UserSummary[]>([])
const loading = ref(true)
const error = ref('')
const submitting = ref(false)
const completing = ref(false)
const sanitizationError = ref('')
const sanitizationSuccess = ref('')
const sanitizationData = ref<Record<string, {
  sanitization_result: 'PASS' | 'FAIL' | ''
}>>({})
const workOrderNotesEdit = ref('')
const savingNotes = ref(false)
const notesError = ref('')
const selectedAssets = ref<string[]>([])
const manualMovement = ref({ release_destination: '', other_destination: '', selectedShipmentId: '', shipmentSearchQuery: '' })
const manualMovementSubmitting = ref(false)
const manualMovementError = ref('')
const manualMovementSuccess = ref('')
const showShipmentAssetSelector = ref(false)
const selectedAssetsForShipment = ref<string[]>([])
const selectedShipmentId = ref('')
const shipmentAssetSubmitting = ref(false)
const shipmentAssetError = ref('')
const shipmentAssetSuccess = ref('')
const expandedTransitionGroups = ref<Set<string>>(new Set())
const showShipmentDropdown = ref(false)
const allShipments = ref<Array<{ id: string; carrier?: string; tracking_number?: string; destination_address?: string }>>([])
const shipmentDropdownWrapper = ref<HTMLElement | null>(null)
const removingAssetId = ref<string | null>(null)

const ASSET_LOCATIONS = [
  { value: 'INTAKE', label: 'Intake' },
  { value: 'DIRTY_CAGE', label: 'Dirty Cage' },
  { value: 'WIPE_STATION', label: 'Wipe Station' },
  { value: 'CLEAN_CAGE', label: 'Clean Cage' },
  { value: 'SHIPMENT_STAGING_AREA', label: 'Shipment Staging Area' },
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

const employeeSelectOptions = computed<FilterableOption[]>(() => {
  return employees.value.map(employee => ({
    value: String(employee.id),
    label: employee.username,
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
  
  // Complete only allowed when every asset is in one of two final states:
  // DESTROYED @ DESTRUCTION or RELEASED @ SHIPPED
  const allAtFinalDestinations = workOrder.value.assets.every(asset => {
    const isDestroyed = asset.status === 'DESTROYED' && asset.location === 'DESTRUCTION'
    const isShipped = asset.status === 'RELEASED' && asset.location === 'SHIPPED'
    return isDestroyed || isShipped
  })
  return allAtFinalDestinations
})

const allowedStatusOptions = computed(() => {
  const status = workOrder.value?.status
  if (!status || status === 'COMPLETED') return []
  const options: { value: string; label: string }[] = []
  // Once IN_PROGRESS or beyond, hide CREATED (can't go back)
  if (status === 'CREATED') {
    options.push({ value: 'CREATED', label: formatStatusLabel('CREATED') })
  }
  options.push({ value: 'IN_PROGRESS', label: formatStatusLabel('IN_PROGRESS') })
  options.push({ value: 'PAUSED', label: formatStatusLabel('PAUSED') })
  // COMPLETED only when all assets in final state
  if (canCompleteWorkOrder.value) {
    options.push({ value: 'COMPLETED', label: formatStatusLabel('COMPLETED') })
  }
  options.push({ value: 'CANCELLED', label: formatStatusLabel('CANCELLED') })
  return options
})

const showManualMovement = computed(() => {
  if (!workOrder.value) return false
  // Show manual movement only if there are assets with valid transitions
  return workOrder.value.assets.some(asset => {
    // Check if asset can be moved (basic checks)
    if (asset.location === 'SHIPPED' || asset.status === 'DESTROYED' || asset.status === 'RELEASED') {
      return false
    }
    // Check if asset has a valid transition
    const transition = getAssetNextTransition(asset)
    return transition !== null
  })
})

const hasEligibleShipmentAssets = computed(() => {
  if (!workOrder.value) return false
  return workOrder.value.assets.some(asset => 
    asset.location === 'CLEAN_CAGE' && asset.status === 'SANITIZED_PASS'
  )
})

const openShipments = computed(() => {
  if (!workOrder.value?.shipments) return []
  return workOrder.value.shipments.filter((s: { shipped_at?: string | null }) => !s.shipped_at)
})

const eligibleShipmentAssets = computed(() => {
  if (!workOrder.value) return []
  return workOrder.value.assets.filter(asset => {
    const isEligible = asset.location === 'CLEAN_CAGE' && asset.status === 'SANITIZED_PASS'
    // Include assets already in shipments so user can see them (they'll be disabled)
    return isEligible
  }).map(asset => ({
    ...asset,
    shipment_id: (asset as any).shipment_id || null,
  }))
})

const hasCleanCageAssets = computed(() => {
  if (!workOrder.value || selectedAssets.value.length === 0) return false
  return selectedAssets.value.some(assetId => {
    const asset = workOrder.value?.assets.find(a => a.id === assetId)
    return asset?.location === 'CLEAN_CAGE'
  })
})

const allAssetsSelected = computed(() => {
  if (!workOrder.value || !showManualMovement.value) return false
  const movableAssets = workOrder.value.assets.filter(asset => canMoveAsset(asset))
  return movableAssets.length > 0 && movableAssets.every(asset => selectedAssets.value.includes(asset.id))
})

const someAssetsSelected = computed(() => {
  if (!workOrder.value || !showManualMovement.value) return false
  const movableAssets = workOrder.value.assets.filter(asset => canMoveAsset(asset))
  return movableAssets.some(asset => selectedAssets.value.includes(asset.id)) && !allAssetsSelected.value
})

const selectedAssetsByTransition = computed(() => {
  if (!workOrder.value || selectedAssets.value.length === 0) return {}
  
  const groups: Record<string, { transition: AssetTransition | null; assetIds: string[]; borderColor: string }> = {}
  const noTransitionGroup = 'NO_TRANSITION'
  
  selectedAssets.value.forEach(assetId => {
    const asset = workOrder.value?.assets.find(a => a.id === assetId)
    if (!asset) return
    
    const transition = getAssetNextTransition(asset)
    
    // Create a unique key for this transition, or use NO_TRANSITION key
    const transitionKey = transition 
      ? `${transition.fromStatus}|${transition.fromLocation}|${transition.toStatus}|${transition.toLocation}`
      : noTransitionGroup
    
    if (!groups[transitionKey]) {
      // Determine border color based on destination
      let borderColor = 'var(--color-border)' // default gray
      if (transition) {
        if (transition.toLocation === 'DESTRUCTION' || transition.toStatus === 'DESTROYED') {
          borderColor = '#dc2626' // red for destruction
        } else if (transition.toLocation === 'SHIPPED' || transition.toLocation === 'SHIPMENT_STAGING_AREA' || transition.toStatus === 'RELEASED') {
          borderColor = '#059669' // green for shipping/release/staging
        } else if (transition.toLocation === 'CLEAN_CAGE') {
          borderColor = '#2563eb' // blue for clean cage
        } else if (transition.toLocation === 'WIPE_STATION') {
          borderColor = '#f59e0b' // amber for wipe station
        }
      } else {
        borderColor = '#6b7280' // gray for no transition
      }
      
      groups[transitionKey] = {
        transition: transition || null,
        assetIds: [],
        borderColor,
      }
    }
    groups[transitionKey].assetIds.push(assetId)
  })
  
  return groups
})

function toggleTransitionGroup(transitionKey: string) {
  if (expandedTransitionGroups.value.has(transitionKey)) {
    expandedTransitionGroups.value.delete(transitionKey)
  } else {
    expandedTransitionGroups.value.add(transitionKey)
  }
}

const filteredShipmentsForSelection = computed(() => {
  const query = (manualMovement.value.shipmentSearchQuery || '').toLowerCase().trim()
  if (!query) return allShipments.value
  
  return allShipments.value.filter(shipment => {
    const carrier = (shipment.carrier || '').toLowerCase()
    const tracking = (shipment.tracking_number || '').toLowerCase()
    const address = (shipment.destination_address || '').toLowerCase()
    return carrier.includes(query) || tracking.includes(query) || address.includes(query)
  })
})

const selectedShipmentDisplay = computed(() => {
  if (!manualMovement.value.selectedShipmentId) return ''
  const shipment = allShipments.value.find(s => s.id === manualMovement.value.selectedShipmentId)
  if (!shipment) return ''
  const parts = []
  if (shipment.carrier) parts.push(shipment.carrier)
  if (shipment.tracking_number) parts.push(shipment.tracking_number)
  return parts.join(' - ') || 'Selected shipment'
})

const canSubmitManualMovement = computed(() => {
  if (selectedAssets.value.length === 0) return false
  
  // Check each transition group for required fields
  const groups = selectedAssetsByTransition.value
  let hasValidTransitions = false
  
  for (const group of Object.values(groups)) {
    // Skip groups without valid transitions
    if (!group.transition) continue
    
    hasValidTransitions = true
    
    if (group.transition.requiresReleaseDestination) {
      if (!manualMovement.value.release_destination) return false
      if (manualMovement.value.release_destination === 'Other' && !manualMovement.value.other_destination.trim()) return false
    }
    
    if (group.transition.requiresShipmentSelection) {
      if (!manualMovement.value.selectedShipmentId) return false
    }
  }
  
  // Must have at least one group with a valid transition
  return hasValidTransitions
})

interface AssetTransition {
  fromStatus: string
  fromLocation: string
  toStatus: string
  toLocation: string
  requiresReleaseDestination?: boolean
  requiresShipmentSelection?: boolean
  requiresSanitizationRecord?: boolean
}

function getAssetNextTransition(asset: AssetSummary): AssetTransition | null {
  // Can't transition assets that are already at final destinations
  // Note: RELEASED @ SHIPMENT_STAGING_AREA can still transition to SHIPPED when shipment completes
  if (asset.location === 'SHIPPED' || asset.status === 'DESTROYED' || (asset.status === 'RELEASED' && asset.location !== 'SHIPMENT_STAGING_AREA')) {
    return null
  }

  const status = asset.status
  const location = asset.location
  const hasSanitizationRecord = !!(asset as any).latest_sanitization_record_id
  const sanitizationResult = (asset as any).latest_sanitization_result

  // Define valid transitions based on transition_rules.py
  // RECEIVED @ INTAKE -> PENDING_SANITIZATION @ DIRTY_CAGE or INTAKE
  if (status === 'RECEIVED' && location === 'INTAKE') {
    return {
      fromStatus: status,
      fromLocation: location,
      toStatus: 'PENDING_SANITIZATION',
      toLocation: 'DIRTY_CAGE',
    }
  }

  // PENDING_SANITIZATION @ DIRTY_CAGE -> PENDING_SANITIZATION @ WIPE_STATION
  if (status === 'PENDING_SANITIZATION' && location === 'DIRTY_CAGE') {
    return {
      fromStatus: status,
      fromLocation: location,
      toStatus: 'PENDING_SANITIZATION',
      toLocation: 'WIPE_STATION',
    }
  }

  // PENDING_SANITIZATION @ INTAKE -> PENDING_SANITIZATION @ WIPE_STATION
  if (status === 'PENDING_SANITIZATION' && location === 'INTAKE') {
    return {
      fromStatus: status,
      fromLocation: location,
      toStatus: 'PENDING_SANITIZATION',
      toLocation: 'WIPE_STATION',
    }
  }

  // PENDING_SANITIZATION @ WIPE_STATION -> SANITIZED_PASS @ CLEAN_CAGE (if PASS) or SANITIZED_FAIL @ DESTRUCTION (if FAIL)
  if (status === 'PENDING_SANITIZATION' && location === 'WIPE_STATION') {
    if (!hasSanitizationRecord) {
      return null // Can't move without sanitization record
    }
    if (sanitizationResult === 'PASS') {
      return {
        fromStatus: status,
        fromLocation: location,
        toStatus: 'SANITIZED_PASS',
        toLocation: 'CLEAN_CAGE',
        requiresSanitizationRecord: true,
      }
    }
    if (sanitizationResult === 'FAIL') {
      return {
        fromStatus: status,
        fromLocation: location,
        toStatus: 'SANITIZED_FAIL',
        toLocation: 'DESTRUCTION',
        requiresSanitizationRecord: true,
      }
    }
    return null // Unknown sanitization result
  }

  // SANITIZED_FAIL @ WIPE_STATION -> DESTROYED @ DESTRUCTION
  if (status === 'SANITIZED_FAIL' && location === 'WIPE_STATION') {
    return {
      fromStatus: status,
      fromLocation: location,
      toStatus: 'DESTROYED',
      toLocation: 'DESTRUCTION',
    }
  }

  // SANITIZED_PASS @ CLEAN_CAGE -> RELEASED @ SHIPMENT_STAGING_AREA (requires shipment selection)
  // Assets will transition to SHIPPED when their shipment is marked as complete
  if (status === 'SANITIZED_PASS' && location === 'CLEAN_CAGE') {
    return {
      fromStatus: status,
      fromLocation: location,
      toStatus: 'RELEASED',
      toLocation: 'SHIPMENT_STAGING_AREA',
      requiresShipmentSelection: true,
    }
  }

  // PENDING_SANITIZATION @ DIRTY_CAGE -> DESTROYED @ DESTRUCTION (skip wipe)
  if (status === 'PENDING_SANITIZATION' && location === 'DIRTY_CAGE') {
    // This is a valid transition but we'll prioritize WIPE_STATION
    // Only allow if explicitly requested
    return null // Don't auto-detect this, require explicit action
  }

  // PENDING_SANITIZATION @ INTAKE -> DESTROYED @ DESTRUCTION (skip wipe)
  if (status === 'PENDING_SANITIZATION' && location === 'INTAKE') {
    // Similar to above
    return null
  }

  // SANITIZED_FAIL @ DESTRUCTION -> DESTROYED @ DESTRUCTION
  if (status === 'SANITIZED_FAIL' && location === 'DESTRUCTION') {
    return {
      fromStatus: status,
      fromLocation: location,
      toStatus: 'DESTROYED',
      toLocation: 'DESTRUCTION',
    }
  }

  // PENDING_SANITIZATION @ DESTRUCTION -> DESTROYED @ DESTRUCTION
  if (status === 'PENDING_SANITIZATION' && location === 'DESTRUCTION') {
    return {
      fromStatus: status,
      fromLocation: location,
      toStatus: 'DESTROYED',
      toLocation: 'DESTRUCTION',
    }
  }

  return null // No valid transition found
}

function canMoveAsset(asset: AssetSummary): boolean {
  // Can't move assets that are already at final destinations
  const locationValue = (asset as any).locationValue || asset.location
  if (locationValue === 'SHIPPED' || asset.status === 'DESTROYED' || asset.status === 'RELEASED') {
    return false
  }
  // Can't move assets at WIPE_STATION with PENDING_SANITIZATION status without sanitization records (they need sanitization first)
  // Employees must select PASS/FAIL before these assets can be moved
  if (locationValue === 'WIPE_STATION' && asset.status === 'PENDING_SANITIZATION' && !(asset as any).latest_sanitization_record_id) {
    return false
  }
  // Allow selection - transition detection will handle grouping and validation
  return true
}

function toggleAsset(assetId: string) {
  const asset = workOrder.value?.assets.find(a => a.id === assetId)
  if (!asset) return
  
  // Only allow toggling if asset can be moved (basic checks)
  if (!canMoveAsset(asset)) {
    return
  }
  
  const index = selectedAssets.value.indexOf(assetId)
  if (index > -1) {
    selectedAssets.value.splice(index, 1)
    // Clear release destination if no CLEAN_CAGE assets remain
    if (!hasCleanCageAssets.value) {
      manualMovement.value.release_destination = ''
      manualMovement.value.other_destination = ''
    }
  } else {
    selectedAssets.value.push(assetId)
  }
}

function toggleAllAssets() {
  if (!workOrder.value) return
  const movableAssets = workOrder.value.assets.filter(asset => canMoveAsset(asset))
  if (allAssetsSelected.value) {
    selectedAssets.value = []
  } else {
    selectedAssets.value = movableAssets.map(asset => asset.id)
  }
}

function selectShipment(shipmentId: string) {
  manualMovement.value.selectedShipmentId = shipmentId
  manualMovement.value.shipmentSearchQuery = ''
  showShipmentDropdown.value = false
}

function filterShipments() {
  // Filtering is handled by computed property
}


function clearManualMovementSelection() {
  selectedAssets.value = []
  manualMovement.value = { release_destination: '', other_destination: '', selectedShipmentId: '', shipmentSearchQuery: '' }
  manualMovementError.value = ''
  manualMovementSuccess.value = ''
  showShipmentDropdown.value = false
}

async function submitManualMovement() {
  if (!workOrder.value || selectedAssets.value.length === 0) return
  if (!canSubmitManualMovement.value) return
  
  manualMovementSubmitting.value = true
  manualMovementError.value = ''
  manualMovementSuccess.value = ''
  
  try {
    const groups = selectedAssetsByTransition.value
    const allErrors: string[] = []
    let totalProcessed = 0
    const skippedAssets: string[] = []
    
    // Process each transition group separately
    for (const group of Object.values(groups)) {
      // Skip groups without valid transitions
      if (!group.transition) {
        skippedAssets.push(...group.assetIds)
        continue
      }
      
      // Build release destination for groups that require it
      let releaseDestination = ''
      const assetDestinations: Array<{ asset_id: string; release_destination: string }> = []
      
      if (group.transition.requiresReleaseDestination) {
        if (manualMovement.value.release_destination === 'Other') {
          releaseDestination = `Other: ${manualMovement.value.other_destination.trim()}`
        } else {
          releaseDestination = manualMovement.value.release_destination
        }
        
        // Apply to all assets in this group
        group.assetIds.forEach(assetId => {
          assetDestinations.push({
            asset_id: assetId,
            release_destination: releaseDestination,
          })
        })
      }
      
      // Handle shipment selection for CLEAN_CAGE -> SHIPMENT_STAGING_AREA transitions
      if (group.transition.requiresShipmentSelection && manualMovement.value.selectedShipmentId) {
        // Transition assets to SHIPMENT_STAGING_AREA with shipment_id
        // The backend will handle adding assets to the shipment and transitioning to SHIPMENT_STAGING_AREA
        try {
          const result = await confirmWorkOrder({
            work_order_id: workOrder.value.id,
            confirmed_asset_ids: group.assetIds,
            shipment_id: manualMovement.value.selectedShipmentId,
            release_destination: releaseDestination || undefined,
            asset_destinations: assetDestinations.length > 0 ? assetDestinations : undefined,
          })
          
          if (result.errors && result.errors.length > 0) {
            allErrors.push(...result.errors)
          } else {
            totalProcessed += result.processed.length
          }
        } catch (e) {
          allErrors.push(e instanceof Error ? e.message : 'Failed to move assets in this group')
        }
      } else {
        // Standard transition without shipment
        try {
          const result = await confirmWorkOrder({
            work_order_id: workOrder.value.id,
            confirmed_asset_ids: group.assetIds,
            release_destination: releaseDestination || undefined,
            asset_destinations: assetDestinations.length > 0 ? assetDestinations : undefined,
          })
          
          if (result.errors && result.errors.length > 0) {
            allErrors.push(...result.errors)
          } else {
            totalProcessed += result.processed.length
          }
        } catch (e) {
          allErrors.push(e instanceof Error ? e.message : 'Failed to move assets in this group')
        }
      }
    }
    
    // Build success/error message
    let message = ''
    if (totalProcessed > 0) {
      message = `Successfully moved ${totalProcessed} asset(s) manually.`
    }
    if (skippedAssets.length > 0) {
      const skippedCount = skippedAssets.length
      const skippedDetails = skippedAssets.slice(0, 3).map(id => {
        const asset = workOrder.value?.assets.find(a => a.id === id)
        return asset ? formatAssetId(asset.id) : id.slice(0, 8)
      }).join(', ')
      const moreText = skippedCount > 3 ? ` and ${skippedCount - 3} more` : ''
      message += ` ${skippedCount} asset(s) skipped (no valid transition): ${skippedDetails}${moreText}.`
    }
    if (allErrors.length > 0) {
      manualMovementError.value = allErrors.join('; ')
      if (message) {
        manualMovementError.value += ` ${message}`
      }
    } else if (message) {
      manualMovementSuccess.value = message
      // Clear selection and reload work order
      clearManualMovementSelection()
      await loadWorkOrder()
      // Clear success message after delay
      setTimeout(() => {
        manualMovementSuccess.value = ''
      }, 5000)
    } else {
      manualMovementError.value = 'No assets could be moved.'
    }
  } catch (e) {
    manualMovementError.value = e instanceof Error ? e.message : 'Failed to move assets'
  } finally {
    manualMovementSubmitting.value = false
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function goToShipment(shipmentId: string | null) {
  if (!shipmentId) return
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

async function saveWorkOrderNotes() {
  if (!workOrder.value) return
  savingNotes.value = true
  notesError.value = ''
  try {
    await updateWorkOrder(workOrder.value.id, { notes: workOrderNotesEdit.value })
    await loadWorkOrder()
    workOrderNotesEdit.value = workOrder.value?.notes || ''
  } catch (e) {
    notesError.value = e instanceof Error ? e.message : 'Failed to save notes'
  } finally {
    savingNotes.value = false
  }
}

function formatStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    'CREATED': 'Created',
    'IN_PROGRESS': 'In Progress',
    'PAUSED': 'Paused',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled',
  }
  return statusMap[status] || status
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message
    // Try to parse JSON error response
    try {
      const parsed = JSON.parse(message)
      if (parsed.status && Array.isArray(parsed.status)) {
        return parsed.status.join(', ')
      }
      if (parsed.detail) {
        return parsed.detail
      }
      if (parsed.error) {
        return parsed.error
      }
    } catch {
      // Not JSON, use message as-is
    }
    return message
  }
  return 'An unexpected error occurred'
}

async function updateWorkOrderStatus() {
  if (!workOrder.value || !workOrderStatusEdit.value) return
  if (workOrderStatusEdit.value === workOrder.value.status) return
  
  savingStatus.value = true
  const previousStatus = workOrder.value.status
  
  try {
    // Update local state immediately for instant feedback
    workOrder.value.status = workOrderStatusEdit.value as any
    
    // Save to backend
    await updateWorkOrder(workOrder.value.id, { status: workOrderStatusEdit.value })
    
    // Reload to get any server-side updates (e.g., completed_at timestamp)
    await loadWorkOrder()
  } catch (e) {
    // Revert on error
    workOrderStatusEdit.value = previousStatus
    if (workOrder.value) {
      workOrder.value.status = previousStatus as any
    }
    const errorMessage = extractErrorMessage(e)
    showError(errorMessage)
  } finally {
    savingStatus.value = false
  }
}

async function updateWorkOrderAssignedTo(newValue?: string) {
  // Handle both direct calls and event-based calls from FilterableSelect
  const assignedToValue = newValue !== undefined ? newValue : workOrderAssignedToEdit.value
  
  if (!workOrder.value || !assignedToValue) return
  // Compare as strings to handle UUID comparison
  if (String(assignedToValue) === String(workOrder.value.assigned_to)) return
  
  // Update the ref value if it wasn't already updated
  if (newValue !== undefined) {
    workOrderAssignedToEdit.value = assignedToValue
  }
  
  savingAssignedTo.value = true
  const previousAssignedTo = workOrder.value.assigned_to
  
  try {
    // Update local state immediately for instant feedback
    const newEmployee = employees.value.find(e => String(e.id) === String(assignedToValue))
    if (newEmployee) {
      workOrder.value.assigned_to = String(assignedToValue)
      workOrder.value.assigned_to_username = newEmployee.username
    }
    
    // Save to backend
    await updateWorkOrder(workOrder.value.id, { assigned_to: assignedToValue })
    
    // Reload to get any server-side updates
    await loadWorkOrder()
  } catch (e) {
    // Revert on error
    workOrderAssignedToEdit.value = String(previousAssignedTo)
    if (workOrder.value) {
      workOrder.value.assigned_to = String(previousAssignedTo)
    }
    const errorMessage = extractErrorMessage(e)
    showError(errorMessage)
  } finally {
    savingAssignedTo.value = false
  }
}

async function removeAssetFromWorkOrderHandler(assetId: string) {
  if (!workOrder.value) return
  
  if (!confirm('Are you sure you want to remove this asset from the work order? The asset will be available for other work orders.')) {
    return
  }
  
  removingAssetId.value = assetId
  try {
    await removeAssetFromWorkOrder(workOrder.value.id, assetId)
    await loadWorkOrder()
  } catch (e) {
    const errorMessage = extractErrorMessage(e)
    showError(errorMessage)
  } finally {
    removingAssetId.value = null
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
    const msg = extractErrorMessage(e)
    error.value = msg
    showError(msg)
  } finally {
    completing.value = false
  }
}

function toggleAssetForShipment(assetId: string) {
  const index = selectedAssetsForShipment.value.indexOf(assetId)
  if (index > -1) {
    selectedAssetsForShipment.value.splice(index, 1)
  } else {
    selectedAssetsForShipment.value.push(assetId)
  }
}

function clearShipmentAssetSelection() {
  showShipmentAssetSelector.value = false
  selectedAssetsForShipment.value = []
  selectedShipmentId.value = ''
  shipmentAssetError.value = ''
  shipmentAssetSuccess.value = ''
}

async function submitAddAssetsToShipment() {
  if (!workOrder.value || !selectedShipmentId.value || selectedAssetsForShipment.value.length === 0) return
  
  shipmentAssetSubmitting.value = true
  shipmentAssetError.value = ''
  shipmentAssetSuccess.value = ''
  
  try {
    // Add each asset to the shipment one by one
    const errors: string[] = []
    let successCount = 0
    
    for (const assetId of selectedAssetsForShipment.value) {
      try {
        await addAssetToShipment(selectedShipmentId.value, assetId)
        successCount++
      } catch (e) {
        const asset = workOrder.value.assets.find(a => a.id === assetId)
        const assetLabel = asset ? formatAssetId(asset.id) : assetId
        errors.push(`${assetLabel}: ${e instanceof Error ? e.message : 'Failed to add'}`)
      }
    }
    
    if (errors.length > 0) {
      shipmentAssetError.value = `Some assets could not be added: ${errors.join('; ')}`
      if (successCount > 0) {
        shipmentAssetError.value += ` (${successCount} asset(s) were successfully added)`
      }
    } else {
      shipmentAssetSuccess.value = `Successfully added ${successCount} asset(s) to shipment.`
      // Clear selection and reload work order
      clearShipmentAssetSelection()
      await loadWorkOrder()
      // Clear success message after delay
      setTimeout(() => {
        shipmentAssetSuccess.value = ''
      }, 3000)
    }
  } catch (e) {
    shipmentAssetError.value = e instanceof Error ? e.message : 'Failed to add assets to shipment'
  } finally {
    shipmentAssetSubmitting.value = false
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
      assetId: asset.id,
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
  // TODO: Call API endpoint to generate PDF certificate
  // await generateWorkOrderCertificate(workOrder.value.id)
  console.log('Certificate data:', certificateData)
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
    workOrderNotesEdit.value = workOrder.value.notes || ''
    workOrderStatusEdit.value = workOrder.value.status
    // Set assigned_to value - ensure it's a string to match option values
    workOrderAssignedToEdit.value = String(workOrder.value.assigned_to) || ''
  }
}, { immediate: true })

// Watch for when employees are loaded to ensure dropdown shows correct value
// This handles the case where employees load after the work order
watch(() => employees.value, () => {
  if (workOrder.value && employees.value.length > 0 && workOrder.value.assigned_to) {
    // Sync the assigned_to value when employees become available
    const currentValue = String(workOrderAssignedToEdit.value)
    const expectedValue = String(workOrder.value.assigned_to)
    if (currentValue !== expectedValue) {
      workOrderAssignedToEdit.value = expectedValue
    }
  }
})

onMounted(async () => {
  try {
    me.value = await getMe()
  } catch {
    // not authenticated or failed
  }
  
  // Load employees for assigned_to dropdown (always load if we're on this page)
  // The dropdown will only show if user is an employee anyway
  try {
    employees.value = await getUsersByType('EMPLOYEE')
  } catch (e) {
    console.error('Failed to load employees:', e)
  }
  
  // Load all unshipped shipments for the shipment selector
  try {
    const shipments = await getShipments({ status: 'DRAFT' })
    allShipments.value = shipments.map(s => ({
      id: s.id,
      carrier: s.carrier,
      tracking_number: s.tracking_number,
      destination_address: s.destination_address,
    }))
  } catch (e) {
    console.error('Failed to load shipments:', e)
  }
  
  // Add click-outside handler for shipment dropdown
  const handleClickOutside = (event: MouseEvent) => {
    if (shipmentDropdownWrapper.value && !shipmentDropdownWrapper.value.contains(event.target as Node)) {
      showShipmentDropdown.value = false
    }
  }
  document.addEventListener('click', handleClickOutside)
  
  loadWorkOrder()
})
</script>

<style scoped lang="scss">
@use '../styles/views/work-order-detail';
</style>
