<template>
  <section class="customer-asset-detail">
    <header class="detail-header">
      <div>
        <h2>Asset Details</h2>
        <p class="subtitle">Full lifecycle and status for asset {{ asset ? formatAssetId(asset.id, true) : '' }}</p>
      </div>
      <router-link v-if="asset?.intake_request_id" :to="`${basePath}/requests/${asset.intake_request_id}`" class="btn-link">
        View Request
      </router-link>
    </header>

    <div v-if="loading" class="card">Loading asset…</div>
    <div v-else-if="error" class="card error-card">{{ error }}</div>
    <div v-else-if="asset" class="detail-grid">
      <article class="card">
        <h3>Summary</h3>
        <dl class="summary-dl">
          <dt>Asset ID</dt>
          <dd><strong>{{ formatAssetId(asset.id, true) }}</strong></dd>
          <dt>Status</dt>
          <dd><span class="badge" :data-status="asset.status">{{ formatStatus(asset.status) }}</span></dd>
          <dt>Location</dt>
          <dd>{{ getLocationLabel(asset.location) }}</dd>
          <dt>Manufacturer / Model</dt>
          <dd>{{ asset.manufacturer_model || '—' }}</dd>
          <dt>Serial Number</dt>
          <dd>{{ asset.serial_number || '—' }}</dd>
          <dt>Intake Date</dt>
          <dd>{{ asset.intake_timestamp ? formatDate(asset.intake_timestamp) : (asset.created_at ? formatDate(asset.created_at) : '—') }}</dd>
          <dt>Last Updated</dt>
          <dd>{{ formatDate(asset.updated_at) }}</dd>
          <dt v-if="asset.intake_request_id">Request</dt>
          <dd v-if="asset.intake_request_id">
            <router-link :to="`${basePath}/requests/${asset.intake_request_id}`">
              View Request ({{ asset.intake_request_status || 'N/A' }})
            </router-link>
          </dd>
          <dt>Notes</dt>
          <dd class="notes">{{ asset.public_notes || '—' }}</dd>
        </dl>

        <div v-if="asset.status === 'DESTROYED' || asset.status === 'SANITIZED_FAIL'" class="certificate-section">
          <h4>Certificate of Destruction</h4>
          <p class="certificate-desc">Download the certificate of destruction for this asset.</p>
          <button type="button" class="btn-primary" :disabled="downloadingCert" @click="downloadCertificate">
            {{ downloadingCert ? 'Downloading…' : 'Download Certificate PDF' }}
          </button>
        </div>

        <div v-if="asset.location === 'SHIPPED' && asset.shipment_id" class="shipment-section">
          <h4>Shipment Information</h4>
          <p class="shipment-desc">This asset is part of a shipment.</p>
          <router-link :to="`${basePath}/shipments/${asset.shipment_id}`" class="btn-link">
            View Shipment
          </router-link>
        </div>
      </article>

      <article class="card history-card">
        <h3>Chain of Custody</h3>
        <div class="history-content">
          <p v-if="auditEvents.length === 0" class="empty-history">No audit events recorded yet.</p>
          <ol v-else class="timeline">
            <li v-for="ev in auditEvents" :key="ev.id" class="timeline-item">
              <div class="timeline-meta">
                <span class="time">{{ formatDate(ev.timestamp) }}</span>
                <span class="event-type">
                <template v-if="eventDisplayParts(ev)">
                  <template v-for="(p, i) in eventDisplayParts(ev)!" :key="p.label">
                    <template v-if="i > 0">; </template>
                    {{ p.label }}
                    <template v-if="p.from"> updated from <span class="audit-value">{{ p.from }}</span> to <span class="audit-value">{{ p.to }}</span></template>
                    <template v-else> set to <span class="audit-value">{{ p.to }}</span></template>
                  </template>
                </template>
                <template v-else>{{ getAuditEventDisplayText(ev) }}</template>
              </span>
                <span v-if="ev.user_username" class="user">by {{ ev.user_username }}</span>
              </div>
            </li>
          </ol>
        </div>
        <div v-if="auditEvents.length > 0" class="chain-of-custody-actions">
          <button type="button" class="btn-secondary" :disabled="downloadingChain" @click="downloadChainOfCustody">
            {{ downloadingChain ? 'Downloading…' : 'Download Chain of Custody PDF' }}
          </button>
        </div>
      </article>

      <article v-if="incidents.length > 0" class="card incidents-card">
        <h3>Incidents / Corrections</h3>
        <p class="incidents-desc">Corrections (e.g. serial number or make/model) and their status. Expand for full history.</p>
        <div v-for="inc in incidents" :key="inc.id" class="incident-block">
          <div
            class="incident-header incident-header-clickable"
            role="button"
            tabindex="0"
            :aria-expanded="expandedIncidentIds.has(inc.id)"
            @click="toggleIncident(inc.id)"
            @keydown.enter.space.prevent="toggleIncident(inc.id)"
          >
            <span class="incident-shorthand">{{ getIncidentShortLabel(inc) }}</span>
            <span class="incident-status" :class="inc.status">{{ inc.status }}</span>
            <span class="incident-dates">
              Opened {{ formatDate(inc.reported_at) }}
              <template v-if="inc.resolved_at"> · Resolved {{ formatDate(inc.resolved_at) }}</template>
            </span>
            <span class="incident-chevron" :class="{ expanded: expandedIncidentIds.has(inc.id) }">▼</span>
          </div>
          <div v-show="expandedIncidentIds.has(inc.id)" class="incident-body">
            <p v-if="inc.description" class="incident-description">{{ inc.description }}</p>
            <dl class="incident-meta">
              <dt>Opened</dt>
              <dd>{{ formatDate(inc.reported_at) }}</dd>
              <template v-if="inc.resolved_at">
                <dt>Resolved</dt>
                <dd>{{ formatDate(inc.resolved_at) }}</dd>
                <dt v-if="inc.resolution_notes">Resolution</dt>
                <dd v-if="inc.resolution_notes" class="notes">{{ inc.resolution_notes }}</dd>
              </template>
            </dl>
            <h4 class="incident-timeline-title">Timeline</h4>
            <ol class="timeline incident-timeline">
              <li v-for="(item, idx) in inc.timeline" :key="idx" class="timeline-item">
                <div class="timeline-meta">
                  <span class="time">{{ formatDate(item.timestamp) }}</span>
                  <span class="event-type">{{ item.summary || item.type }}</span>
                  <span v-if="item.user_username" class="user">by {{ item.user_username }}</span>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useNotifications } from '../composables/useNotifications'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  getCustomerAsset,
  getCustomerAuditEvents,
  getCustomerAssetIncidents,
  getLocationLabel,
  getAuditEventDisplayText,
  getAuditEventDisplayParts,
  downloadCustomerCertificateOfDestructionPDF,
  downloadCustomerChainOfCustodyPDF,
  downloadEmployeeCertificateOfDestructionPDF,
  downloadEmployeeChainOfCustodyPDF,
  INCIDENT_REASON,
} from '../api'
import type { AssetDetail, CustomerAssetIncident } from '../api'
import { formatAssetId } from '../utils/format'

const route = useRoute()
const id = computed(() => String(route.params.id || ''))
const isEmployeePreview = computed(() => route.path.includes('/employee-portal/customers/'))
const customerId = computed(() => isEmployeePreview.value ? String(route.params.customerId || '') : null)
const loading = ref(true)
const error = ref('')
const asset = ref<(AssetDetail & { intake_request_id?: string; intake_request_status?: string }) | null>(null)
const auditEvents = ref<import('../api').AuditEventSummary[]>([])
const incidents = ref<CustomerAssetIncident[]>([])
const expandedIncidentIds = ref<Set<string>>(new Set())
const downloadingCert = ref(false)
const downloadingChain = ref(false)

function getIncidentShortLabel(inc: CustomerAssetIncident): string {
  switch (inc.reason) {
    case INCIDENT_REASON.UPDATE_SERIAL_NUMBER:
      return 'Serial update'
    case INCIDENT_REASON.UPDATE_MAKE_MODEL:
      return 'Make/Model update'
    case INCIDENT_REASON.UPDATE_SERIAL_AND_MODEL:
      return 'Both update'
    default:
      return inc.reason_display || 'Correction'
  }
}

function eventDisplayParts(ev: { event_type: string; old_value?: unknown; new_value?: unknown }) {
  return getAuditEventDisplayParts(ev)
}

function toggleIncident(id: string) {
  const next = new Set(expandedIncidentIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedIncidentIds.value = next
}

const basePath = computed(() => {
  if (route.path.includes('/employee-portal/customers/')) {
    return `/employee-portal/customers/${String(route.params.customerId || '')}/portal`
  }
  return '/customer-portal'
})

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
      throw new Error('Missing asset id.')
    }
    const assetParams: Parameters<typeof getCustomerAsset>[1] = {}
    // For employee preview, pass customer_id
    if (isEmployeePreview.value && customerId.value) {
      assetParams.customer_id = customerId.value
    }
    const auditParams = { asset_id: id.value, page_size: 200 }
    if (isEmployeePreview.value && customerId.value) {
      (auditParams as { customer_id?: string }).customer_id = customerId.value
    }
    const incidentParams = isEmployeePreview.value && customerId.value ? { customer_id: customerId.value } : undefined
    const [assetData, auditRes, incidentsList] = await Promise.all([
      getCustomerAsset(id.value, assetParams),
      getCustomerAuditEvents(auditParams).catch(() => ({ results: [], count: 0 })),
      getCustomerAssetIncidents(id.value, incidentParams).catch(() => []),
    ])
    asset.value = assetData
    auditEvents.value = auditRes.results
    incidents.value = incidentsList
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load asset.'
  } finally {
    loading.value = false
  }
}

async function downloadCertificate() {
  if (!asset.value) return
  downloadingCert.value = true
  try {
    const blob = isEmployeePreview.value
      ? await downloadEmployeeCertificateOfDestructionPDF(asset.value.id)
      : await downloadCustomerCertificateOfDestructionPDF({ asset_id: asset.value.id })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `certificate-of-destruction-${asset.value.id.slice(0, 8)}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (e) {
    const { error: showError } = useNotifications()
    showError(e instanceof Error ? e.message : 'Failed to download certificate')
  } finally {
    downloadingCert.value = false
  }
}

async function downloadChainOfCustody() {
  if (!asset.value) return
  downloadingChain.value = true
  try {
    const blob = isEmployeePreview.value
      ? await downloadEmployeeChainOfCustodyPDF(asset.value.id)
      : await downloadCustomerChainOfCustodyPDF(asset.value.id)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chain-of-custody-${asset.value.id.slice(0, 8)}.pdf`
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

onMounted(() => {
  load().catch(() => {})
})
</script>

<style scoped lang="scss">
@use '../styles/views/customer-asset-detail';
</style>
