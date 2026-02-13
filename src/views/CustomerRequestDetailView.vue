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
      <article class="card">
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
        </template>

        <div
          v-if="canEditDropoff && request.delivery_type === 'DROP_OFF' && (!request.drop_off_preferred_start && !request.drop_off_preferred_end)"
          class="dropoff-editor"
        >
          <h4>Set drop-off window</h4>
          <p class="subtitle">Provide your preferred drop-off window for this request.</p>
          <div class="dropoff-grid">
            <div>
              <label class="field-label" for="detail-dropoff-start">Preferred start</label>
              <input id="detail-dropoff-start" v-model="dropOffStart" type="datetime-local" class="text-input" />
            </div>
            <div>
              <label class="field-label" for="detail-dropoff-end">Preferred end</label>
              <input id="detail-dropoff-end" v-model="dropOffEnd" type="datetime-local" class="text-input" />
            </div>
          </div>
          <button type="button" class="btn-primary" :disabled="savingDropoff" @click="saveDropoff">
            {{ savingDropoff ? 'Saving…' : 'Save drop-off window' }}
          </button>
          <p v-if="dropoffError" class="inline-error">{{ dropoffError }}</p>
        </div>
      </article>

      <article class="card">
        <h3>History</h3>
        <p v-if="history.length === 0 && workOrders.length === 0" class="empty-history">No history events recorded yet.</p>
        <ol v-else class="timeline">
          <li v-for="ev in history" :key="ev.timestamp + ev.event_type" class="timeline-item">
            <div class="timeline-meta">
              <span class="time">{{ formatDate(ev.timestamp) }}</span>
              <span class="event-type">{{ getEventTypeDisplay(ev.event_type) }}</span>
              <span v-if="ev.user" class="user">by {{ ev.user }}</span>
            </div>
            <ul class="payload-readable">
              <li v-for="(line, i) in formatEventDetailReadable(ev)" :key="i">{{ line }}</li>
            </ul>
          </li>
          <li v-for="wo in workOrders" :key="wo.id" class="timeline-item">
            <div class="timeline-meta">
              <span class="time">{{ formatDate(wo.created_at) }}</span>
              <span class="event-type">Work Order Created</span>
              <span v-if="wo.assigned_to_username" class="user">assigned to {{ wo.assigned_to_username }}</span>
            </div>
            <ul class="payload-readable">
              <li>Work Order: {{ wo.work_order_number }}</li>
              <li>Status: {{ wo.status }}</li>
              <li>Assets: {{ wo.asset_count }}</li>
              <li v-if="wo.completed_at">Completed: {{ formatDate(wo.completed_at) }}</li>
            </ul>
          </li>
        </ol>
      </article>

      <article class="card assets-card">
        <h3>Assets</h3>
        <p v-if="requestAssets.length === 0" class="empty-history">No assets received for this request yet.</p>
        <div v-else class="assets-table-wrap">
          <table class="assets-table">
            <thead>
              <tr>
                <th>Internal ID</th>
                <th>Status</th>
                <th>Serial number</th>
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
                <td>{{ a.internal_asset_id }}</td>
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
          <dt>Internal ID</dt>
          <dd>{{ selectedAsset.internal_asset_id }}</dd>
          <dt>Status</dt>
          <dd>{{ selectedAsset.status_display }}</dd>
          <dt>Serial number</dt>
          <dd>{{ selectedAsset.serial_number || '—' }}</dd>
          <dt>Location</dt>
          <dd>{{ selectedAsset.location_display }}</dd>
          <dt>Manufacturer / model</dt>
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
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getIntakeRequest, getIntakeRequestHistory, getIntakeRequestAssets, getIntakeRequestWorkOrders, getEventTypeDisplay, getIntakeRequestStatusDisplay, updateIntakeRequest, type IntakeRequestSummary, type IntakeRequestAssetSummary, type WorkOrderSummary } from '../api'

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
const dropOffStart = ref('')
const dropOffEnd = ref('')
const savingDropoff = ref(false)
const dropoffError = ref('')
const requestAssets = ref<IntakeRequestAssetSummary[]>([])
const selectedAsset = ref<IntakeRequestAssetSummary | null>(null)
const workOrders = ref<WorkOrderSummary[]>([])

const canEditDropoff = computed(() => !route.meta.customerPortalReadonly)

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function prettyStatus(status: string) {
  return status.replace(/_/g, ' ')
}

function logisticsLabel(r: IntakeRequestSummary): string {
  const type = r.delivery_type || 'PICKUP'
  if (type === 'DROP_OFF') {
    if (r.drop_off_preferred_start || r.drop_off_preferred_end) {
      const start = r.drop_off_preferred_start ? formatDate(r.drop_off_preferred_start) : ''
      const end = r.drop_off_preferred_end ? formatDate(r.drop_off_preferred_end) : ''
      return ['Drop-off', start && `from ${start}`, end && `to ${end}`].filter(Boolean).join(' ')
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
  const dropStartOld = oldVal.drop_off_preferred_start
  const dropEndOld = oldVal.drop_off_preferred_end
  const dropStartNew = newVal.drop_off_preferred_start
  const dropEndNew = newVal.drop_off_preferred_end
  if (dropStartOld !== dropStartNew || dropEndOld !== dropEndNew) {
    if (dropStartNew || dropEndNew) {
      lines.push(`Drop-off window: ${fmt(dropStartNew)} – ${fmt(dropEndNew)}`)
    } else {
      lines.push('Drop-off window: (cleared)')
    }
  }
  if (isEmployeeView.value && oldVal.internal_notes !== newVal.internal_notes) {
    const label = 'Internal notes'
    if (newVal.internal_notes) lines.push(`${label}: ${fmt(newVal.internal_notes)}`)
    else lines.push(`${label}: (cleared)`)
  }

  return lines.length ? lines : ['No visible changes']
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (!id.value) {
      throw new Error('Missing request id.')
    }
    request.value = await getIntakeRequest(id.value)
    const [historyData, assetsData, workOrdersData] = await Promise.all([
      getIntakeRequestHistory(id.value),
      getIntakeRequestAssets(id.value),
      getIntakeRequestWorkOrders(id.value).catch(() => []),
    ])
    history.value = historyData
    requestAssets.value = assetsData
    workOrders.value = workOrdersData
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load request.'
  } finally {
    loading.value = false
  }
}

async function saveDropoff() {
  if (!request.value) return
  dropoffError.value = ''
  savingDropoff.value = true
  try {
    const payload: Parameters<typeof updateIntakeRequest>[1] = {}
    if (dropOffStart.value) payload.drop_off_preferred_start = new Date(dropOffStart.value).toISOString()
    if (dropOffEnd.value) payload.drop_off_preferred_end = new Date(dropOffEnd.value).toISOString()
    const updated = await updateIntakeRequest(request.value.id, payload)
    request.value = { ...request.value, ...updated }
    history.value = await getIntakeRequestHistory(request.value.id)
    requestAssets.value = await getIntakeRequestAssets(request.value.id)
    workOrders.value = await getIntakeRequestWorkOrders(request.value.id).catch(() => [])
  } catch (e) {
    dropoffError.value = e instanceof Error ? e.message : 'Failed to save drop-off window.'
  } finally {
    savingDropoff.value = false
  }
}

onMounted(() => {
  load().catch(() => {})
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

.internal-notes-heading {
  margin: 0 0 $space-2;
  font-size: $font-size-base;
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

.dropoff-editor {
  margin-top: $space-4;
  padding-top: $space-3;
  border-top: 1px solid var(--color-border);
}

.dropoff-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $space-3;
  margin-bottom: $space-2;
}

.inline-error {
  margin: $space-1 0 0;
  color: var(--color-error);
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

