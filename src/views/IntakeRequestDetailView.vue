<template>
  <div class="intake-request-detail">
    <div v-if="loading" class="loading">Loading…</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <template v-else-if="request">
      <header class="detail-header">
        <div>
          <h1>Intake request</h1>
          <p class="subtitle">Request ID: {{ request.id }}</p>
        </div>
        <span class="status-pill" :class="`status-${request.status?.toLowerCase()}`">{{ request.status }}</span>
      </header>

      <section class="card summary-card">
        <h2 class="card-title">Summary</h2>
        <table class="detail-table">
          <tbody>
            <tr>
              <th scope="row">Created</th>
              <td>{{ formatDate(request.created_at) }}</td>
            </tr>
            <tr>
              <th scope="row">Company</th>
              <td>{{ request.customer_name || request.company_name_raw || '—' }}</td>
            </tr>
            <tr>
              <th scope="row">Contact</th>
              <td>{{ [request.contact_name, request.contact_email, request.contact_phone].filter(Boolean).join(' · ') || '—' }}</td>
            </tr>
            <tr>
              <th scope="row">Asset types</th>
              <td>{{ request.asset_quantities_display || request.asset_types_display?.join(', ') || '—' }}</td>
            </tr>
            <tr>
              <th scope="row">Customer notes</th>
              <td class="detail-notes">{{ request.notes || '—' }}</td>
            </tr>
            <tr>
              <th scope="row">Delivery</th>
              <td>{{ logisticsLabel(request) }}</td>
            </tr>
            <tr v-if="request.rejected_reason">
              <th scope="row">Rejection reason</th>
              <td class="detail-notes">{{ request.rejected_reason }}</td>
            </tr>
            <tr v-if="request.accepted_at">
              <th scope="row">Accepted</th>
              <td>{{ formatDate(request.accepted_at) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-if="request.items && request.items.length > 0" class="card items-card">
        <h2 class="card-title">Items (what the customer listed)</h2>
        <table class="items-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Serial number</th>
              <th>Manufacturer / Model</th>
              <th v-if="hasOtherItem">Other description</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in request.items" :key="idx">
              <td>{{ assetTypeLabel(item.asset_type) }}</td>
              <td>{{ item.serial_number || '—' }}</td>
              <td>{{ item.manufacturer_model || '—' }}</td>
              <td v-if="hasOtherItem">{{ item.asset_type === 'OTHER' ? (item.type_other || '—') : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="card actions-card">
        <h2 class="card-title">Actions</h2>
        <div v-if="!showRejectForm && !showStatusNoteForm" class="actions-row">
          <template v-if="request.status === 'PENDING'">
            <button type="button" class="btn-sm btn-seen" @click="setStatus('SEEN')">Mark seen</button>
          </template>
          <template v-if="['PENDING', 'SEEN'].includes(request.status)">
            <button type="button" class="btn-sm btn-accept" @click="setStatus('ACCEPTED')">Accept</button>
            <button type="button" class="btn-sm btn-reject" @click="showRejectForm = true">Reject</button>
          </template>
          <template v-if="request.status === 'ACCEPTED'">
            <router-link
              :to="{ path: '/employee-portal/intake', query: { intake_request_id: request.id } }"
              class="btn-sm btn-complete"
            >
              Start intake
            </router-link>
          </template>
          <button type="button" class="btn-sm btn-status-note" @click="showStatusNoteForm = true">Add status note</button>
        </div>

        <div v-if="showStatusNoteForm" class="status-note-form">
          <p class="status-note-hint">This note will appear on the customer's request history.</p>
          <textarea
            v-model="statusNoteMessage"
            class="text-input textarea-input"
            rows="3"
            placeholder="Enter status update for the customer…"
          />
          <div class="form-actions">
            <button type="button" class="btn-primary" :disabled="statusNoteSubmitting || !statusNoteMessage.trim()" @click="submitStatusNote">
              {{ statusNoteSubmitting ? 'Sending…' : 'Send' }}
            </button>
            <button type="button" class="btn-secondary" @click="showStatusNoteForm = false; statusNoteMessage = ''">Cancel</button>
          </div>
          <p v-if="statusNoteError" class="error-inline">{{ statusNoteError }}</p>
          <p v-if="statusNoteSuccess" class="success-inline">{{ statusNoteSuccess }}</p>
        </div>

        <div v-if="showRejectForm" class="reject-form">
          <h3 class="reject-title">Reject this request</h3>
          <label class="field-label" for="reject-reason">Reason for rejection <span class="required">*</span></label>
          <textarea
            id="reject-reason"
            v-model="rejectReason"
            class="textarea-input"
            placeholder="Enter reason for rejection…"
            rows="4"
          />
          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="cancelReject">Cancel</button>
            <button type="button" class="btn-danger" :disabled="savingReject || !rejectReason.trim()" @click="confirmReject">Confirm reject</button>
          </div>
          <p v-if="rejectError" class="error-inline">{{ rejectError }}</p>
        </div>

        <p v-if="actionError" class="error-inline">{{ actionError }}</p>
      </section>

      <section v-if="request.status === 'ACCEPTED' && (request.delivery_type || 'PICKUP') === 'PICKUP'" class="card pickup-card">
        <h2 class="card-title">Schedule pickup</h2>
        <p class="pickup-hint">Set when the team will pick up this request.</p>
        <div class="pickup-row">
          <div class="pickup-field">
            <label for="pickup-date">Date</label>
            <input id="pickup-date" v-model="pickupDate" type="date" class="text-input" min="2020-01-01" />
          </div>
          <div class="pickup-field">
            <label for="pickup-time">Time</label>
            <input id="pickup-time" v-model="pickupTime" type="time" class="text-input" />
          </div>
          <button type="button" class="btn-primary" :disabled="savingPickup || !pickupDate || !pickupTime" @click="savePickup">
            {{ savingPickup ? 'Saving…' : 'Save pickup time' }}
          </button>
        </div>
      </section>

      <section class="card notes-card">
        <h2 class="card-title">Internal notes</h2>
        <textarea
          v-model="editInternalNotes"
          class="text-input textarea-input"
          placeholder="Internal notes (staff only)…"
          rows="3"
        />
        <button type="button" class="btn-primary" :disabled="savingNotes" @click="saveInternalNotes">{{ savingNotes ? 'Saving…' : 'Save note' }}</button>
      </section>

      <!-- Pending Status Requests -->
      <section v-if="pendingStatusRequests.length > 0" class="card status-requests-card">
        <h2 class="card-title">Pending Status Requests ({{ pendingStatusRequests.length }})</h2>
        <div v-for="sr in pendingStatusRequests" :key="sr.id" class="pending-request-item">
          <div class="pending-request-header">
            <span class="pending-request-meta">Requested {{ formatDate(sr.requested_at) }} by {{ sr.requested_by_username }}</span>
          </div>
          <div class="pending-request-form">
            <textarea
              v-model="statusResponses[sr.id]"
              class="text-input textarea-input"
              rows="2"
              placeholder="Enter response message..."
              :disabled="respondingToStatusRequest"
            />
            <div class="form-actions">
              <button
                type="button"
                class="btn-primary"
                :disabled="respondingToStatusRequest || !statusResponses[sr.id]?.trim()"
                @click="respondToStatusRequest(sr.id)"
              >
                {{ respondingToStatusRequest ? 'Responding…' : 'Respond' }}
              </button>
            </div>
            <p v-if="statusRequestError" class="error-inline">{{ statusRequestError }}</p>
            <p v-if="statusRequestSuccess" class="success-inline">{{ statusRequestSuccess }}</p>
          </div>
        </div>
      </section>

      <p class="back-link"><router-link to="/employee-portal">Back to dashboard</router-link></p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  getIntakeRequest,
  updateIntakeRequest,
  createStatusUpdate,
  getStatusRequests,
  respondToStatusRequest as respondToStatusRequestAPI,
  INTAKE_REQUEST_ASSET_TYPES,
} from '../api'
import type { IntakeRequestSummary, StatusRequest } from '../api'

const route = useRoute()
const request = ref<IntakeRequestSummary | null>(null)
const loading = ref(true)
const error = ref('')
const actionError = ref('')
const editInternalNotes = ref('')
const savingNotes = ref(false)
const showRejectForm = ref(false)
const showStatusNoteForm = ref(false)
const statusNoteMessage = ref('')
const statusNoteSubmitting = ref(false)
const statusNoteError = ref('')
const statusNoteSuccess = ref('')
const rejectReason = ref('')
const rejectError = ref('')
const savingReject = ref(false)
const pickupDate = ref('')
const pickupTime = ref('')
const savingPickup = ref(false)
const statusRequests = ref<StatusRequest[]>([])
const statusResponses = ref<Record<string, string>>({})
const respondingToStatusRequest = ref(false)
const statusRequestError = ref('')
const statusRequestSuccess = ref('')

const pendingStatusRequests = computed(() => {
  return statusRequests.value.filter(sr => !sr.is_employee_initiated && !sr.responded_at)
})

const id = computed(() => route.params.id as string)

const hasOtherItem = computed(() => request.value?.items?.some((it) => it.asset_type === 'OTHER') ?? false)

function assetTypeLabel(code: string): string {
  return INTAKE_REQUEST_ASSET_TYPES.find((o) => o.value === code)?.label ?? code
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function logisticsLabel(r: IntakeRequestSummary): string {
  const type = r.delivery_type || 'PICKUP'
  if (type === 'DROP_OFF') {
    if (r.drop_off_preferred_start) {
      return `Drop-off preferred: ${formatDate(r.drop_off_preferred_start)}`
    }
    return 'Drop-off'
  }
  if (r.pickup_scheduled_at) return `Pickup ${formatDate(r.pickup_scheduled_at)}`
  return 'Pickup'
}

async function load() {
  if (!id.value) return
  loading.value = true
  error.value = ''
  try {
    const [requestData, statusRequestsData] = await Promise.all([
      getIntakeRequest(id.value),
      getStatusRequests(id.value).catch(() => []),
    ])
    request.value = requestData
    statusRequests.value = statusRequestsData
    editInternalNotes.value = request.value.internal_notes ?? ''
    if (request.value.pickup_scheduled_at) {
      const d = new Date(request.value.pickup_scheduled_at)
      pickupDate.value = d.toISOString().slice(0, 10)
      pickupTime.value = d.toTimeString().slice(0, 5)
    } else {
      pickupDate.value = ''
      pickupTime.value = ''
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load request'
  } finally {
    loading.value = false
  }
}

watch(id, load, { immediate: true })
onMounted(load)

async function setStatus(status: string) {
  if (!request.value) return
  actionError.value = ''
  try {
    request.value = await updateIntakeRequest(request.value.id, { status })
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : 'Update failed.'
  }
}

async function submitStatusNote() {
  if (!request.value || !statusNoteMessage.value.trim()) return
  statusNoteSubmitting.value = true
  statusNoteError.value = ''
  statusNoteSuccess.value = ''
  try {
    await createStatusUpdate(request.value.id, statusNoteMessage.value.trim())
    statusNoteSuccess.value = 'Status note sent.'
    statusNoteMessage.value = ''
    showStatusNoteForm.value = false
  } catch (e) {
    statusNoteError.value = e instanceof Error ? e.message : 'Failed to send status note'
  } finally {
    statusNoteSubmitting.value = false
  }
}

function cancelReject() {
  showRejectForm.value = false
  rejectReason.value = ''
  rejectError.value = ''
}

async function confirmReject() {
  if (!request.value || !rejectReason.value.trim()) return
  rejectError.value = ''
  savingReject.value = true
  try {
    await updateIntakeRequest(request.value.id, { status: 'REJECTED', rejected_reason: rejectReason.value.trim() })
    await load()
    showRejectForm.value = false
    rejectReason.value = ''
  } catch (e) {
    rejectError.value = e instanceof Error ? e.message : 'Reject failed.'
  } finally {
    savingReject.value = false
  }
}

async function savePickup() {
  if (!request.value || !pickupDate.value || !pickupTime.value) return
  actionError.value = ''
  savingPickup.value = true
  try {
    request.value = await updateIntakeRequest(request.value.id, {
      pickup_scheduled_at: new Date(`${pickupDate.value}T${pickupTime.value}`).toISOString(),
    })
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : 'Failed to save pickup time.'
  } finally {
    savingPickup.value = false
  }
}

async function saveInternalNotes() {
  if (!request.value) return
  actionError.value = ''
  savingNotes.value = true
  try {
    request.value = await updateIntakeRequest(request.value.id, { internal_notes: editInternalNotes.value })
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : 'Failed to save note.'
  } finally {
    savingNotes.value = false
  }
}

async function respondToStatusRequest(statusRequestId: string) {
  const message = statusResponses.value[statusRequestId]?.trim()
  if (!message) return
  
  respondingToStatusRequest.value = true
  statusRequestError.value = ''
  statusRequestSuccess.value = ''
  
  try {
    await respondToStatusRequestAPI(statusRequestId, message)
    statusRequestSuccess.value = 'Response sent successfully.'
    statusResponses.value[statusRequestId] = ''
    // Reload status requests
    statusRequests.value = await getStatusRequests(id.value).catch(() => [])
    // Trigger mailbox count update in header
    window.dispatchEvent(new CustomEvent('status-request-responded'))
    // Clear success message after delay
    setTimeout(() => {
      statusRequestSuccess.value = ''
    }, 3000)
  } catch (e) {
    statusRequestError.value = e instanceof Error ? e.message : 'Failed to respond to status request.'
  } finally {
    respondingToStatusRequest.value = false
  }
}
</script>

<style scoped lang="scss">
@use '../styles/views/intake-request-detail';
</style>
