<template>
  <section class="request-detail">
    <header class="detail-header">
      <div>
        <h2>Request detail</h2>
        <p class="subtitle">Full lifecycle and scheduling for this intake request.</p>
      </div>
      <span class="status-pill" :class="`status-${request?.status?.toLowerCase()}`" v-if="request">
        {{ currentStatusLabel }}
      </span>
    </header>

    <div v-if="loading" class="card">Loading request…</div>
    <div v-else-if="error" class="card error-card">{{ error }}</div>
    <div v-else-if="request" class="detail-grid">
      <article ref="summaryCardRef" class="card">
        <h3>Summary</h3>
        <dl class="summary-dl">
          <dt>Request ID</dt>
          <dd>{{ request.id }}</dd>
          <dt>Current status</dt>
          <dd>{{ currentStatusLabel }}</dd>
          <dt>Created</dt>
          <dd>{{ formatDate(request.created_at) }}</dd>
          <dt>Company</dt>
          <dd>{{ request.customer_name || request.company_name_raw || '—' }}</dd>
          <dt>Contact</dt>
          <dd>
            {{
              [request.contact_name, request.contact_email, request.contact_phone].filter(Boolean).join(' · ') || '—'
            }}
          </dd>
          <dt>Items</dt>
          <dd>{{ request.asset_quantities_display || request.asset_types_display.join(', ') || '—' }}</dd>
          <dt>Delivery</dt>
          <dd>{{ logisticsLabel(request) }}</dd>
          <dt>Received at</dt>
          <dd>{{ request.received_at ? formatDate(request.received_at) : '—' }}</dd>
          <dt v-if="request.status === 'REJECTED'">Rejection reason</dt>
          <dd v-if="request.status === 'REJECTED'" class="notes">{{ request.rejected_reason || '—' }}</dd>
          <dt>Customer notes</dt>
          <dd class="notes">{{ request.notes || '—' }}</dd>
        </dl>

        <template v-if="isEmployeeView">
          <hr class="summary-divider" />
          <h4 class="internal-notes-heading">Internal Notes</h4>
          <p class="internal-notes-body notes">{{ request.internal_notes ?? '—' }}</p>
          
          <!-- Employee Status Update Section -->
          <hr class="summary-divider" />
          <h4 class="status-update-heading">Send Status Update</h4>
          <p class="status-update-description">Send a status update to the customer for this request.</p>
          <div class="status-update-form">
            <textarea
              v-model="employeeStatusMessage"
              class="text-input"
              rows="3"
              placeholder="Enter status update message..."
              :disabled="sendingStatusUpdate"
            />
            <div class="status-update-actions">
              <button
                type="button"
                class="btn-primary"
                :disabled="sendingStatusUpdate || !employeeStatusMessage.trim()"
                @click="sendStatusUpdate"
              >
                {{ sendingStatusUpdate ? 'Sending…' : 'Send Update' }}
              </button>
            </div>
            <p v-if="employeeStatusUpdateError" class="inline-error">{{ employeeStatusUpdateError }}</p>
            <p v-if="employeeStatusUpdateSuccess" class="inline-success">{{ employeeStatusUpdateSuccess }}</p>
          </div>
          
          <!-- Pending Status Requests -->
          <div v-if="pendingStatusRequests.length > 0" class="pending-status-requests">
            <hr class="summary-divider" />
            <h4 class="pending-requests-heading">Pending Status Requests ({{ pendingStatusRequests.length }})</h4>
            <div v-for="sr in pendingStatusRequests" :key="sr.id" class="pending-request-item">
              <div class="pending-request-header">
                <span class="pending-request-meta">Requested {{ formatDate(sr.requested_at) }} by {{ sr.requested_by_username }}</span>
              </div>
              <div class="pending-request-form">
                <textarea
                  v-model="statusResponses[sr.id]"
                  class="text-input"
                  rows="2"
                  placeholder="Enter response message..."
                  :disabled="respondingToStatusRequest"
                />
                <button
                  type="button"
                  class="btn-primary btn-sm"
                  :disabled="respondingToStatusRequest || !statusResponses[sr.id]?.trim()"
                  @click="respondToStatusRequest(sr.id)"
                >
                  {{ respondingToStatusRequest ? 'Responding…' : 'Respond' }}
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- Status Request Button (Customer View) -->
        <div v-if="!isEmployeeView && canRequestStatus" class="status-request-section">
          <hr class="summary-divider" />
          <h4 class="status-request-heading">Request Status Update</h4>
          <p class="status-request-description">Need an update on this request? Click below to request a status update from our team.</p>
          <button
            type="button"
            class="btn-primary"
            :disabled="requestingStatus || request?.status === 'COMPLETED' || request?.status === 'REJECTED'"
            @click="requestStatusUpdate"
          >
            {{ requestingStatus ? 'Requesting…' : 'Request Status Update' }}
          </button>
          <p v-if="statusRequestError" class="inline-error">{{ statusRequestError }}</p>
          <p v-if="statusRequestSuccess" class="inline-success">{{ statusRequestSuccess }}</p>
        </div>

        <div
          v-if="canEditDropoff && request.delivery_type === 'DROP_OFF' && !request.drop_off_preferred_start"
          class="dropoff-editor"
        >
          <h4>Set drop-off date & time</h4>
          <p class="subtitle">Provide your preferred date and estimated time for drop-off.</p>
          <div>
            <label class="field-label" for="detail-dropoff-preferred">Preferred date & time</label>
            <input id="detail-dropoff-preferred" v-model="dropOffPreferredAt" type="datetime-local" class="text-input" />
          </div>
          <button type="button" class="btn-primary dropoff-save-btn" :disabled="savingDropoff" @click="saveDropoff">
            {{ savingDropoff ? 'Saving…' : 'Save drop-off window' }}
          </button>
          <p v-if="dropoffError" class="inline-error">{{ dropoffError }}</p>
        </div>
      </article>

      <article ref="historyCardRef" class="card history-card">
        <h3>History</h3>
        <div class="history-content">
          <p v-if="sortedHistory.length === 0 && statusRequests.length === 0" class="empty-history">No history events recorded yet.</p>
          <ol v-else class="timeline">
          <li v-for="item in sortedHistory" :key="item.type === 'history' ? (item.timestamp + (item.data as { event_type: string }).event_type) : (item.data as WorkOrderSummary).id" class="timeline-item">
            <template v-if="item.type === 'history'">
              <div class="timeline-meta">
                <span class="time">{{ formatDate(item.timestamp) }}</span>
                <span class="event-type">{{ getEventTypeDisplay((item.data as { event_type: string }).event_type) }}</span>
                <span v-if="(item.data as { user: string | null }).user" class="user">by {{ (item.data as { user: string | null }).user }}</span>
              </div>
              <ul class="payload-readable">
                <li v-for="(line, i) in formatEventDetailReadable(item.data as { old_value: unknown; new_value: unknown })" :key="i">{{ line }}</li>
              </ul>
            </template>
            <template v-else-if="item.type === 'workorder'">
              <div class="timeline-meta">
                <span class="time">{{ formatDate(item.timestamp) }}</span>
                <span class="event-type">Work Order Created</span>
                <span v-if="(item.data as WorkOrderSummary).assigned_to_username" class="user">assigned to {{ (item.data as WorkOrderSummary).assigned_to_username }}</span>
              </div>
              <ul class="payload-readable">
                <li>Work Order: {{ (item.data as WorkOrderSummary).work_order_number }}</li>
                <li>Status: {{ (item.data as WorkOrderSummary).status }}</li>
                <li>Assets: {{ (item.data as WorkOrderSummary).asset_count }}</li>
                <li v-if="(item.data as WorkOrderSummary).completed_at">Completed: {{ formatDate((item.data as WorkOrderSummary).completed_at!) }}</li>
              </ul>
            </template>
            <template v-else-if="item.type === 'statusrequest'">
              <div class="timeline-meta">
                <span class="time">{{ formatDate(item.timestamp) }}</span>
                <span class="event-type">{{
                  (item.data as StatusRequest).is_employee_initiated
                    ? ((item.data as StatusRequest).requested_by_username
                        ? 'Status Response'
                        : 'Status Note')
                    : 'Status Request'
                }}</span>
                <span v-if="(item.data as StatusRequest).requested_by_username && !(item.data as StatusRequest).responded_at" class="user">requested by {{ (item.data as StatusRequest).requested_by_username }}</span>
                <span v-else-if="(item.data as StatusRequest).responded_by_username" class="user">from {{ (item.data as StatusRequest).responded_by_username }}</span>
              </div>
              <ul class="payload-readable">
                <li v-if="!(item.data as StatusRequest).is_employee_initiated && !(item.data as StatusRequest).responded_at">Status update requested (pending response)</li>
                <li v-if="(item.data as StatusRequest).status_message">{{ (item.data as StatusRequest).status_message }}</li>
              </ul>
            </template>
          </li>
          </ol>
        </div>
      </article>

      <article class="card assets-card">
        <h3>Assets</h3>
        <p v-if="requestAssets.length === 0" class="empty-history">No assets received for this request yet.</p>
        <div v-else class="assets-table-wrap">
          <table class="assets-table">
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Status</th>
                <th>Serial Number</th>
                <th>Location</th>
                <th>Intake time</th>
                <th>Last updated</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="a in requestAssets"
                :key="a.id"
                class="asset-row"
                @click="selectedAsset = a"
              >
                <td>{{ formatAssetId(a.id) }}</td>
                <td>{{ a.status_display }}</td>
                <td>{{ a.serial_number || '—' }}</td>
                <td>{{ a.location_display }}</td>
                <td>{{ a.intake_timestamp ? formatDate(a.intake_timestamp) : (a.created_at ? formatDate(a.created_at) : '—') }}</td>
                <td>{{ formatDate(a.updated_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </div>

    <div v-if="selectedAsset" class="modal-backdrop" @click.self="selectedAsset = null">
      <div class="modal asset-detail-modal" @click.stop>
        <div class="modal-head">
          <h3>Asset details</h3>
          <button type="button" class="modal-close" aria-label="Close" @click="selectedAsset = null">×</button>
        </div>
        <dl class="asset-detail-dl">
          <dt>Asset ID</dt>
          <dd>{{ formatAssetId(selectedAsset.id, true) }}</dd>
          <dt>Status</dt>
          <dd>{{ selectedAsset.status_display }}</dd>
          <dt>Serial Number</dt>
          <dd>{{ selectedAsset.serial_number || '—' }}</dd>
          <dt>Location</dt>
          <dd>{{ selectedAsset.location_display }}</dd>
          <dt>Manufacturer / Model</dt>
          <dd>{{ selectedAsset.manufacturer_model || '—' }}</dd>
          <dt>Intake time</dt>
          <dd>{{ selectedAsset.intake_timestamp ? formatDate(selectedAsset.intake_timestamp) : (selectedAsset.created_at ? formatDate(selectedAsset.created_at) : '—') }}</dd>
          <dt>Last updated</dt>
          <dd>{{ formatDate(selectedAsset.updated_at) }}</dd>
          <dt>Notes</dt>
          <dd class="notes">{{ selectedAsset.public_notes || '—' }}</dd>
        </dl>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="selectedAsset = null">Close</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, onUpdated, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { getIntakeRequest, getIntakeRequestHistory, getIntakeRequestAssets, getIntakeRequestWorkOrders, getEventTypeDisplay, getIntakeRequestStatusDisplay, updateIntakeRequest, createStatusRequest, createStatusUpdate, getStatusRequests, respondToStatusRequest as respondToStatusRequestAPI, INTAKE_REQUEST_ASSET_TYPES, type IntakeRequestSummary, type IntakeRequestAssetSummary, type WorkOrderSummary, type StatusRequest } from '../api'
import { formatAssetId } from '../utils/format'

const route = useRoute()
const id = computed(() => String(route.params.id || ''))
const loading = ref(true)
const error = ref('')
const request = ref<(IntakeRequestSummary & { accepted_by_username?: string | null; internal_notes?: string }) | null>(null)
const isEmployeeView = computed(() => String(route.path).startsWith('/employee-portal'))
const currentStatusLabel = computed(() =>
  request.value ? getIntakeRequestStatusDisplay(request.value) : ''
)
const history = ref<
  Array<{
    timestamp: string
    event_type: string
    user: string | null
    old_value: unknown
    new_value: unknown
  }>
>([])
const dropOffPreferredAt = ref('')
const savingDropoff = ref(false)
const dropoffError = ref('')
const requestAssets = ref<IntakeRequestAssetSummary[]>([])
const selectedAsset = ref<IntakeRequestAssetSummary | null>(null)
const workOrders = ref<WorkOrderSummary[]>([])
const statusRequests = ref<StatusRequest[]>([])
const requestingStatus = ref(false)
const statusRequestError = ref('')
const statusRequestSuccess = ref('')
const employeeStatusMessage = ref('')
const sendingStatusUpdate = ref(false)
const employeeStatusUpdateError = ref('')
const employeeStatusUpdateSuccess = ref('')
const statusResponses = ref<Record<string, string>>({})
const respondingToStatusRequest = ref(false)
const summaryCardRef = ref<HTMLElement | null>(null)
const historyCardRef = ref<HTMLElement | null>(null)

function matchHistoryHeight() {
  if (summaryCardRef.value && historyCardRef.value) {
    const summaryHeight = summaryCardRef.value.offsetHeight
    historyCardRef.value.style.height = `${summaryHeight}px`
  }
}

const canEditDropoff = computed(() => !route.meta.customerPortalReadonly)
const canRequestStatus = computed(() => {
  if (!request.value) return false
  return request.value.status !== 'COMPLETED' && request.value.status !== 'REJECTED'
})

const pendingStatusRequests = computed(() => {
  return statusRequests.value.filter(sr => !sr.is_employee_initiated && !sr.responded_at)
})

// Combine history, work orders, and status requests, sorted by most recent first
const sortedHistory = computed(() => {
  const items: Array<{
    timestamp: string
    type: 'history' | 'workorder' | 'statusrequest'
    data: typeof history.value[0] | WorkOrderSummary | StatusRequest
  }> = []
  
  // Add history events (in customer portal, hide status-related audit events — the status request row already shows the message)
  history.value.forEach(ev => {
    if (!isEmployeeView.value && (ev.event_type === 'STATUS_REQUEST_RESPONDED' || ev.event_type === 'STATUS_UPDATE_SENT')) return
    items.push({ timestamp: ev.timestamp, type: 'history', data: ev })
  })
  
  // Add work orders
  workOrders.value.forEach(wo => {
    items.push({ timestamp: wo.created_at, type: 'workorder', data: wo })
  })
  
  // Add status requests
  statusRequests.value.forEach(sr => {
    // Use responded_at if available, otherwise requested_at
    const timestamp = sr.responded_at || sr.requested_at
    items.push({ timestamp, type: 'statusrequest', data: sr })
  })
  
  // Sort by timestamp descending (most recent first)
  return items.sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime()
    const dateB = new Date(b.timestamp).getTime()
    return dateB - dateA
  })
})

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function assetTypeLabel(code: string): string {
  return INTAKE_REQUEST_ASSET_TYPES.find((o) => o.value === code)?.label ?? code
}


function logisticsLabel(r: IntakeRequestSummary): string {
  const type = r.delivery_type || 'PICKUP'
  if (type === 'DROP_OFF') {
    if (r.drop_off_preferred_start) {
      return `Drop-off preferred: ${formatDate(r.drop_off_preferred_start)}`
    }
    return 'Drop-off'
  }
  if (r.pickup_scheduled_at) {
    return `Pickup scheduled for ${formatDate(r.pickup_scheduled_at)}`
  }
  return 'Pickup'
}

function formatEventDetailReadable(ev: {
  old_value: unknown
  new_value: unknown
}): string[] {
  const lines: string[] = []
  const oldVal = ev.old_value as Record<string, unknown> | null
  const newVal = ev.new_value as Record<string, unknown> | null
  if (!oldVal || !newVal) return lines

  const fmt = (v: unknown): string => {
    if (v == null || v === '') return '—'
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
      try {
        return new Date(v).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
      } catch {
        return String(v)
      }
    }
    return String(v)
  }

  if (oldVal.status !== newVal.status) {
    lines.push(`Status: ${fmt(oldVal.status).replace(/_/g, ' ')} → ${fmt(newVal.status).replace(/_/g, ' ')}`)
  }
  if (oldVal.rejected_reason !== newVal.rejected_reason) {
    const label = 'Rejection reason'
    if (newVal.rejected_reason) lines.push(`${label}: ${fmt(newVal.rejected_reason)}`)
    else lines.push(`${label}: (cleared)`)
  }
  if (oldVal.pickup_scheduled_at !== newVal.pickup_scheduled_at) {
    if (newVal.pickup_scheduled_at) lines.push(`Pickup scheduled: ${fmt(newVal.pickup_scheduled_at)}`)
    else lines.push('Pickup scheduled: (cleared)')
  }
  if (oldVal.drop_off_preferred_start !== newVal.drop_off_preferred_start) {
    if (newVal.drop_off_preferred_start) {
      lines.push(`Drop-off preferred: ${fmt(newVal.drop_off_preferred_start)}`)
    } else {
      lines.push('Drop-off preferred: (cleared)')
    }
  }
  if (isEmployeeView.value && oldVal.internal_notes !== newVal.internal_notes) {
    const label = 'Internal notes'
    if (newVal.internal_notes) lines.push(`${label}: ${fmt(newVal.internal_notes)}`)
    else lines.push(`${label}: (cleared)`)
  }

  return lines
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (!id.value) {
      throw new Error('Missing request id.')
    }
    request.value = await getIntakeRequest(id.value)
    const [historyData, assetsData, workOrdersData, statusRequestsData] = await Promise.all([
      getIntakeRequestHistory(id.value),
      getIntakeRequestAssets(id.value),
      getIntakeRequestWorkOrders(id.value).catch(() => []),
      getStatusRequests(id.value).catch(() => []),
    ])
    history.value = historyData
    requestAssets.value = assetsData
    workOrders.value = workOrdersData
    statusRequests.value = statusRequestsData
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load request.'
  } finally {
    loading.value = false
  }
}

async function requestStatusUpdate() {
  if (!request.value || !canRequestStatus.value) return
  requestingStatus.value = true
  statusRequestError.value = ''
  statusRequestSuccess.value = ''
  
  try {
    await createStatusRequest(request.value.id)
    statusRequestSuccess.value = 'Status update requested. Our team will respond soon.'
    // Reload status requests and history
    await load()
    // Clear success message after delay
    setTimeout(() => {
      statusRequestSuccess.value = ''
    }, 3000)
  } catch (e) {
    statusRequestError.value = e instanceof Error ? e.message : 'Failed to request status update.'
  } finally {
    requestingStatus.value = false
  }
}

async function sendStatusUpdate() {
  if (!request.value || !employeeStatusMessage.value.trim()) return
  sendingStatusUpdate.value = true
  employeeStatusUpdateError.value = ''
  employeeStatusUpdateSuccess.value = ''
  
  try {
    await createStatusUpdate(request.value.id, employeeStatusMessage.value.trim())
    employeeStatusUpdateSuccess.value = 'Status update sent successfully.'
    employeeStatusMessage.value = ''
    // Reload status requests and history
    await load()
    // Clear success message after delay
    setTimeout(() => {
      employeeStatusUpdateSuccess.value = ''
    }, 3000)
  } catch (e) {
    employeeStatusUpdateError.value = e instanceof Error ? e.message : 'Failed to send status update.'
  } finally {
    sendingStatusUpdate.value = false
  }
}

async function respondToStatusRequest(statusRequestId: string) {
  const message = statusResponses.value[statusRequestId]?.trim()
  if (!message) return
  
  respondingToStatusRequest.value = true
  employeeStatusUpdateError.value = ''
  employeeStatusUpdateSuccess.value = ''
  
  try {
    await respondToStatusRequestAPI(statusRequestId, message)
    employeeStatusUpdateSuccess.value = 'Response sent successfully.'
    statusResponses.value[statusRequestId] = ''
    // Reload status requests and history
    await load()
    // Trigger mailbox count update in header
    window.dispatchEvent(new CustomEvent('status-request-responded'))
    // Clear success message after delay
    setTimeout(() => {
      employeeStatusUpdateSuccess.value = ''
    }, 3000)
  } catch (e) {
    employeeStatusUpdateError.value = e instanceof Error ? e.message : 'Failed to respond to status request.'
  } finally {
    respondingToStatusRequest.value = false
  }
}

async function saveDropoff() {
  if (!request.value) return
  dropoffError.value = ''
  savingDropoff.value = true
  try {
    const payload: Parameters<typeof updateIntakeRequest>[1] = {}
    if (dropOffPreferredAt.value) {
      payload.drop_off_preferred_start = new Date(dropOffPreferredAt.value).toISOString()
      payload.drop_off_preferred_end = null
    }
    const updated = await updateIntakeRequest(request.value.id, payload)
    request.value = { ...request.value, ...updated }
    history.value = await getIntakeRequestHistory(request.value.id)
    requestAssets.value = await getIntakeRequestAssets(request.value.id)
    workOrders.value = await getIntakeRequestWorkOrders(request.value.id).catch(() => [])
    statusRequests.value = await getStatusRequests(request.value.id).catch(() => [])
  } catch (e) {
    dropoffError.value = e instanceof Error ? e.message : 'Failed to save drop-off window.'
  } finally {
    savingDropoff.value = false
  }
}

onMounted(() => {
  load().catch(() => {})
  nextTick(() => {
    matchHistoryHeight()
    // Use ResizeObserver to update height when summary card changes
    if (summaryCardRef.value) {
      const observer = new ResizeObserver(() => {
        matchHistoryHeight()
      })
      observer.observe(summaryCardRef.value)
    }
  })
})

onUpdated(() => {
  nextTick(() => {
    matchHistoryHeight()
  })
})
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.request-detail {
  display: grid;
  gap: $space-5;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $space-4;
}

.detail-header h2 {
  margin: 0 0 $space-1;
}

.subtitle {
  margin: 0;
  color: var(--color-text-muted);
  font-size: $font-size-sm;
}

.status-pill {
  border-radius: 999px;
  padding: $space-1 $space-3;
  font-size: $font-size-sm;
  font-weight: 600;
  background: #e2e8f0;
  color: #0f172a;
}

.status-pending { background: #fef3c7; color: #92400e; }
.status-seen { background: #dbeafe; color: #1d4ed8; }
.status-accepted { background: #dcfce7; color: #166534; }
.status-picking_up { background: #e0e7ff; color: #3730a3; }
.status-received { background: #ccfbf1; color: #0f766e; }
.status-completed { background: #ccfbf1; color: #0f766e; }
.status-rejected { background: #fee2e2; color: #b91c1c; }

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: $radius-lg;
  padding: $space-5;
  box-shadow: var(--shadow-sm);
}

.error-card {
  border-color: var(--color-error);
  color: var(--color-error);
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: $space-4;
  align-items: start;
}

.detail-grid > .card {
  display: flex;
  flex-direction: column;
}

/* Summary card determines its own height naturally - no constraints */

/* History card: height set dynamically to match summary, content scrolls */
.detail-grid > .card.history-card {
  min-height: 300px;
  overflow: hidden;
}

.summary-dl {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: $space-1 $space-4;
  margin: 0;
}

.summary-dl dt {
  font-weight: 600;
  color: var(--color-text-muted);
}

.summary-dl dd {
  margin: 0;
}

.notes {
  white-space: pre-wrap;
}

.summary-divider {
  margin: $space-4 0;
  border: 0;
  border-top: 1px solid var(--color-border);
}

.items-table-heading,
.internal-notes-heading {
  margin: 0 0 $space-2;
  font-size: $font-size-base;
  font-weight: 600;
  color: var(--color-text-muted);
}

.items-table-wrap {
  overflow-x: auto;
  margin-top: $space-2;
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
}

.items-table th {
  font-weight: 600;
  color: var(--color-text-muted);
}

.internal-notes-body {
  margin: 0;
}

.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: $space-3;
}

.timeline-item {
  border-left: 2px solid var(--color-border);
  padding-left: $space-3;
}

.timeline-meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  font-size: $font-size-sm;
  color: var(--color-text-muted);
}

.time {
  font-weight: 600;
}

.event-type {
  font-weight: 600;
}

.user {
  font-style: italic;
}

.payload-readable {
  margin: $space-1 0 0;
  padding-left: $space-4;
  font-size: $font-size-sm;
  line-height: 1.5;
  list-style: disc;
}

.payload-readable li {
  margin-bottom: $space-1;
}

.empty-history {
  margin: 0;
  color: var(--color-text-muted);
}

.history-card {
  display: flex;
  flex-direction: column;
}

.history-content {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.dropoff-editor {
  margin-top: $space-4;
  padding-top: $space-3;
  border-top: 1px solid var(--color-border);
  display: grid;
  gap: $space-3;
}

.dropoff-editor > div {
  display: grid;
  gap: $space-2;
}

.dropoff-save-btn {
  margin-top: $space-2;
}
.inline-error {
  margin: $space-1 0 0;
  color: var(--color-error);
}

.inline-success {
  margin: $space-1 0 0;
  color: var(--color-success, #059669);
}

.status-request-section {
  margin-top: $space-4;
  padding-top: $space-3;
}

.status-request-heading {
  margin: 0 0 $space-2;
  font-size: $font-size-base;
  font-weight: 600;
}

.status-request-description {
  margin: 0 0 $space-3;
  color: var(--color-text-muted);
  font-size: $font-size-sm;
}

.status-update-heading,
.pending-requests-heading {
  margin: 0 0 $space-2;
  font-size: $font-size-base;
  font-weight: 600;
}

.status-update-description {
  margin: 0 0 $space-3;
  color: var(--color-text-muted);
  font-size: $font-size-sm;
}

.status-update-form {
  display: grid;
  gap: $space-2;
}

.status-update-actions {
  display: flex;
  gap: $space-2;
}

.pending-status-requests {
  margin-top: $space-4;
}

.pending-request-item {
  margin-bottom: $space-4;
  padding: $space-3;
  background: var(--color-bg-subtle, rgba(0 0 0 / 0.02));
  border-radius: $radius-md;
}

.pending-request-header {
  margin-bottom: $space-2;
}

.pending-request-meta {
  font-size: $font-size-sm;
  color: var(--color-text-muted);
}

.pending-request-form {
  display: grid;
  gap: $space-2;
}

.btn-sm {
  padding: $space-1 $space-2;
  font-size: $font-size-sm;
}

.assets-card {
  grid-column: 1 / -1;
}

.assets-table-wrap {
  overflow-x: auto;
}

.assets-table {
  width: 100%;
  border-collapse: collapse;
  font-size: $font-size-sm;
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

.asset-row {
  cursor: pointer;
}

.asset-row:hover {
  background: var(--color-background);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.asset-detail-modal .modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-4;
}

.asset-detail-modal .modal-head h3 {
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 0 $space-1;
  line-height: 1;
}

.asset-detail-dl {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: $space-1 $space-4;
  margin: 0 0 $space-4;
}

.asset-detail-dl dt {
  font-weight: 600;
  color: var(--color-text-muted);
}

.asset-detail-dl dd {
  margin: 0;
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

