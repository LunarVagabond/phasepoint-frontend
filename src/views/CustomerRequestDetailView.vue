<template>
  <section class="request-detail">
    <header class="detail-header">
      <div>
        <h2>Request detail</h2>
        <p class="subtitle">Full lifecycle and scheduling for this intake request.</p>
      </div>
      <span class="status-pill" :class="`status-${request?.status?.toLowerCase()}`" v-if="request">
        {{ prettyStatus(request.status) }}
      </span>
    </header>

    <div v-if="loading" class="card">Loading request…</div>
    <div v-else-if="error" class="card error-card">{{ error }}</div>
    <div v-else-if="request" class="detail-grid">
      <article class="card">
        <h3>Summary</h3>
        <dl class="summary-dl">
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
          <dt v-if="request.status === 'REJECTED'">Rejection reason</dt>
          <dd v-if="request.status === 'REJECTED'" class="notes">{{ request.rejected_reason || '—' }}</dd>
          <dt>Customer notes</dt>
          <dd class="notes">{{ request.notes || '—' }}</dd>
        </dl>

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
        <p v-if="history.length === 0" class="empty-history">No history events recorded yet.</p>
        <ol v-else class="timeline">
          <li v-for="ev in history" :key="ev.timestamp + ev.event_type" class="timeline-item">
            <div class="timeline-meta">
              <span class="time">{{ formatDate(ev.timestamp) }}</span>
              <span class="event-type">{{ ev.event_type }}</span>
              <span v-if="ev.user" class="user">by {{ ev.user }}</span>
            </div>
            <pre class="payload">{{ formatEventDetail(ev) }}</pre>
          </li>
        </ol>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getIntakeRequest, getIntakeRequestHistory, updateIntakeRequest, type IntakeRequestSummary } from '../api'

const route = useRoute()
const id = computed(() => String(route.params.id || ''))
const loading = ref(true)
const error = ref('')
const request = ref<(IntakeRequestSummary & { accepted_by_username?: string | null }) | null>(null)
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
    return `Pickup ${formatDate(r.pickup_scheduled_at)}`
  }
  return 'Pickup'
}

function formatEventDetail(ev: {
  old_value: unknown
  new_value: unknown
}): string {
  try {
    return JSON.stringify({ old: ev.old_value, new: ev.new_value }, null, 2)
  } catch {
    return String(ev.new_value ?? '')
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (!id.value) {
      throw new Error('Missing request id.')
    }
    request.value = await getIntakeRequest(id.value)
    history.value = await getIntakeRequestHistory(id.value)
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
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.user {
  font-style: italic;
}

.payload {
  margin: $space-1 0 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.75rem;
  background: var(--color-background);
  border-radius: $radius-md;
  padding: $space-2 $space-3;
  overflow-x: auto;
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

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

