<template>
  <div class="reports">
    <header class="reports-header">
      <p class="reports-description">
        Download compliance and operational reports for audit, disposition tracking, and chain of custody.
        Reports are available in CSV format for use in spreadsheets or external systems.
      </p>
      <div class="reports-filters">
        <label class="reports-filter-label">Customer</label>
        <select v-model="selectedCustomerId" class="reports-filter-select" aria-label="Filter by customer">
          <option value="">All (system-wide)</option>
          <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <label class="reports-filter-label">From:</label>
        <input v-model="createdAfter" type="date" class="reports-filter-input" />
        <label class="reports-filter-label">To:</label>
        <input v-model="createdBefore" type="date" class="reports-filter-input" />
      </div>
    </header>
    <p v-if="downloadError" class="reports-error">{{ downloadError }}</p>
    <section class="reports-grid">
      <article class="report-card">
        <h2 class="report-card-title">Asset disposition</h2>
        <p class="report-card-desc">
          Summary of all assets and their current disposition status (received, sanitized, destroyed, released).
        </p>
        <button type="button" class="report-download" @click="download('reports/asset-disposition/', 'asset_disposition')">
          Download CSV
        </button>
      </article>
      <article class="report-card">
        <h2 class="report-card-title">Certificate of destruction</h2>
        <p class="report-card-desc">
          Evidence of destruction for assets that have been physically destroyed, suitable for compliance records.
        </p>
        <button type="button" class="report-download" @click="download('reports/certificate-of-destruction/', 'certificate_of_destruction')">
          Download CSV
        </button>
        <button type="button" class="report-download" @click="downloadPdf('reports/certificate-of-destruction/pdf', 'certificate_of_destruction')">
          Download PDF
        </button>
      </article>
      <article class="report-card">
        <h2 class="report-card-title">Chain of custody</h2>
        <p class="report-card-desc">
          Audit events for a single asset. Provide asset_id in URL for PDF (e.g. ?asset_id=...).
        </p>
        <button type="button" class="report-download" @click="downloadPdf('reports/chain-of-custody/pdf', 'chain_of_custody')">
          Download PDF (requires asset_id)
        </button>
      </article>
      <article class="report-card">
        <h2 class="report-card-title">User action logs</h2>
        <p class="report-card-desc">
          Audit trail of user actions (intake, custody, sanitization) for traceability and certification.
        </p>
        <button type="button" class="report-download" @click="download('reports/user-action-logs/', 'user_action_logs')">
          Download CSV
        </button>
      </article>
      <article class="report-card">
        <h2 class="report-card-title">KPI dashboard export</h2>
        <p class="report-card-desc">
          Assets processed by employee, stage distribution, sustainability totals, and open workflow alerts.
        </p>
        <button type="button" class="report-download" @click="download('reports/kpis/', 'kpi_report')">
          Download CSV
        </button>
        <button type="button" class="report-download" @click="downloadPdf('kpi-pdf', 'kpi_report')">
          Download KPI PDF
        </button>
      </article>
      <article class="report-card">
        <h2 class="report-card-title">Audit events</h2>
        <p class="report-card-desc">
          Full audit event export (same data as user action logs) for compliance and external systems.
        </p>
        <button type="button" class="report-download" @click="download('reports/audit-events/', 'audit_events')">
          Download CSV
        </button>
      </article>
      <article class="report-card">
        <h2 class="report-card-title">Audit summary</h2>
        <p class="report-card-desc">
          Counts by event type and by user; optional customer and date range.
        </p>
        <button type="button" class="report-download" @click="download('reports/audit-summary/', 'audit_summary')">
          Download CSV
        </button>
      </article>
      <article class="report-card">
        <h2 class="report-card-title">Shipments</h2>
        <p class="report-card-desc">
          List of shipments (work order, carrier, tracking, shipped_at, destination type).
        </p>
        <button type="button" class="report-download" @click="download('reports/shipments/', 'shipments')">
          Download CSV
        </button>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request, getCustomers } from '../api'
import type { CustomerSummary } from '../api'

const downloadError = ref('')
const customers = ref<CustomerSummary[]>([])
const selectedCustomerId = ref('')
const createdAfter = ref('')
const createdBefore = ref('')

function reportQueryString(): string {
  const params = new URLSearchParams()
  params.set('format', 'csv')
  if (selectedCustomerId.value) params.set('customer_id', selectedCustomerId.value)
  if (createdAfter.value) params.set('created_after', createdAfter.value + 'T00:00:00Z')
  if (createdBefore.value) params.set('created_before', createdBefore.value + 'T23:59:59Z')
  return params.toString()
}

function reportQueryStringForPdf(): string {
  const params = new URLSearchParams()
  if (selectedCustomerId.value) params.set('customer_id', selectedCustomerId.value)
  if (createdAfter.value) params.set('created_after', createdAfter.value + 'T00:00:00Z')
  if (createdBefore.value) params.set('created_before', createdBefore.value + 'T23:59:59Z')
  return params.toString()
}

/** Filename: <customer>_<report_type>_YYYYMMDD_HH_MM.<ext> */
function reportDownloadFilename(reportType: string, ext: 'csv' | 'pdf'): string {
  const customerSlug = selectedCustomerId.value
    ? (customers.value.find(c => c.id === selectedCustomerId.value)?.name ?? 'customer')
        .replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '') || 'customer'
    : 'all'
  const now = new Date()
  const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}_${String(now.getMinutes()).padStart(2, '0')}`
  return `${customerSlug}_${reportType}_${ts}.${ext}`
}

onMounted(async () => {
  try {
    customers.value = await getCustomers()
  } catch {
    customers.value = []
  }
})

async function download(path: string, name: string) {
  downloadError.value = ''
  const pathNorm = path.startsWith('/') ? path : `/${path}`
  const qs = reportQueryString()
  const url = qs ? `${pathNorm}?${qs}` : `${pathNorm}?format=csv`
  try {
    const r = await request(url)
    if (!r.ok) {
      const text = await r.text()
      try {
        const j = JSON.parse(text)
        throw new Error(j.detail || text || 'Failed to get report')
      } catch (e) {
        if (e instanceof Error) throw e
        throw new Error(text || 'Failed to get report')
      }
    }
    const blob = await r.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = reportDownloadFilename(name, 'csv')
    a.click()
    URL.revokeObjectURL(a.href)
  } catch (e) {
    downloadError.value = e instanceof Error ? e.message : 'Failed to download report'
  }
}

async function downloadPdf(path: string, name: string) {
  downloadError.value = ''
  const pathNorm = path.startsWith('/') ? path : `/${path}`
  const qs = reportQueryStringForPdf()
  const needFormat = pathNorm.includes('kpi')
  const sep = pathNorm.includes('?') ? '&' : '?'
  const url = qs ? `${pathNorm}?${qs}${needFormat ? '&format=pdf' : ''}` : `${pathNorm}${sep}format=pdf`
  try {
    const r = await request(url)
    if (!r.ok) {
      const text = await r.text()
      let msg = ''
      try {
        const j = JSON.parse(text)
        if (j.detail) msg = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail)
      } catch {
        msg = text.slice(0, 200) || `HTTP ${r.status}`
      }
      const statusText = r.status ? `${r.status} ${r.statusText || ''}`.trim() : 'Error'
      downloadError.value = `PDF report failed (${statusText})${msg ? `: ${msg}` : ''}`
      return
    }
    const blob = await r.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = reportDownloadFilename(name, 'pdf')
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch (e) {
    downloadError.value = e instanceof Error ? e.message : 'Failed to download PDF'
  }
}
</script>

<style scoped>
/* Filter and card styles come from src/styles/views/_reports.scss */
</style>

