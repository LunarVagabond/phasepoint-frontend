<template>
  <div class="status-requests-inbox">
    <header class="list-header">
      <h1 class="list-title">Status Requests</h1>
      <p class="list-desc">Pending customer requests for status updates. Click a request to view details and respond.</p>
    </header>
    <div v-if="loading" class="loading-state">Loading status requests…</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>
    <div v-else-if="statusRequests.length === 0" class="empty-state">
      <p>No pending status requests.</p>
      <p class="empty-hint">Customers can request status updates from their request detail pages.</p>
    </div>
    <div v-else class="status-requests-table-wrap">
      <table class="status-requests-table">
        <thead>
          <tr>
            <th>Requested</th>
            <th>Request ID</th>
            <th>Customer</th>
            <th>Requested By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sr in statusRequests" :key="sr.id" class="status-request-row">
            <td>{{ formatDate(sr.requested_at) }}</td>
            <td>
              <router-link :to="{ name: 'IntakeRequestDetail', params: { id: sr.intake_request } }" class="request-link">
                {{ sr.intake_request.slice(0, 8) }}…
              </router-link>
            </td>
            <td>{{ sr.intake_request_customer_name || '—' }}</td>
            <td>{{ sr.requested_by_username || '—' }}</td>
            <td>
              <button
                type="button"
                class="btn-sm btn-primary"
                @click="openRespondModal(sr)"
              >
                Respond
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Respond Modal -->
    <div v-if="selectedStatusRequest" class="modal-backdrop" @click.self="closeRespondModal">
      <div class="modal modal-wide" @click.stop>
        <h3>Respond to Status Request</h3>
        <div class="modal-content">
          <p class="modal-hint">Customer requested a status update for request <strong>{{ selectedStatusRequest.intake_request.slice(0, 8) }}…</strong></p>
          <div class="form-row">
            <label class="field-label" for="response-message">Status Message <span class="required">*</span></label>
            <textarea
              id="response-message"
              v-model="responseMessage"
              class="text-input textarea-input"
              rows="4"
              placeholder="Enter status update message for the customer…"
            />
          </div>
          <p v-if="respondError" class="modal-error">{{ respondError }}</p>
          <p v-if="respondSuccess" class="modal-success">{{ respondSuccess }}</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" :disabled="responding" @click="closeRespondModal">Cancel</button>
          <button
            type="button"
            class="btn-primary"
            :disabled="responding || !responseMessage.trim()"
            @click="submitResponse"
          >
            {{ responding ? 'Responding…' : 'Send Response' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getPendingStatusRequests, respondToStatusRequest, getIntakeRequest, type StatusRequest } from '../api'
import { useNotifications } from '../composables/useNotifications'
const { success: showSuccess, error: showError } = useNotifications()

const loading = ref(true)
const error = ref('')
const statusRequests = ref<Array<StatusRequest & { intake_request_customer_name?: string }>>([])
const selectedStatusRequest = ref<StatusRequest | null>(null)
const responseMessage = ref('')
const responding = ref(false)
const respondError = ref('')
const respondSuccess = ref('')

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

async function loadStatusRequests() {
  loading.value = true
  error.value = ''
  try {
    const requests = await getPendingStatusRequests()
    // Fetch customer names for each request
    const enriched = await Promise.all(
      requests.map(async (sr) => {
        try {
          const intakeReq = await getIntakeRequest(sr.intake_request)
          return {
            ...sr,
            intake_request_customer_name: intakeReq.customer_name || intakeReq.company_name_raw || '—',
          }
        } catch {
          return { ...sr, intake_request_customer_name: '—' }
        }
      })
    )
    statusRequests.value = enriched
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load status requests'
  } finally {
    loading.value = false
  }
}

function openRespondModal(sr: StatusRequest) {
  selectedStatusRequest.value = sr
  responseMessage.value = ''
  respondError.value = ''
  respondSuccess.value = ''
}

function closeRespondModal() {
  selectedStatusRequest.value = null
  responseMessage.value = ''
  respondError.value = ''
  respondSuccess.value = ''
}

async function submitResponse() {
  if (!selectedStatusRequest.value || !responseMessage.value.trim()) return
  responding.value = true
  respondError.value = ''
  respondSuccess.value = ''
  try {
    await respondToStatusRequest(selectedStatusRequest.value.id, responseMessage.value.trim())
    respondSuccess.value = 'Response sent successfully. The customer will see this update in their request history.'
    showSuccess('Status update sent')
    setTimeout(() => {
      closeRespondModal()
      loadStatusRequests()
    }, 1500)
  } catch (e) {
    respondError.value = e instanceof Error ? e.message : 'Failed to send response'
    showError(respondError.value)
  } finally {
    responding.value = false
  }
}

onMounted(() => {
  loadStatusRequests()
})
</script>

<style scoped lang="scss">
@use '../styles/views/status-requests-inbox';
</style>
