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
    <div class="reports-table-wrap">
      <table class="reports-table">
        <thead>
          <tr>
            <th class="reports-table-name">Name</th>
            <th class="reports-table-summary">Summary</th>
            <th class="reports-table-input">Input required</th>
            <th class="reports-table-csv">Download CSV</th>
            <th class="reports-table-pdf">Download PDF</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="report in reports" :key="report.id" class="reports-table-row">
            <td class="reports-table-name">{{ report.name }}</td>
            <td class="reports-table-summary">{{ report.summary }}</td>
            <td class="reports-table-input">
              <template v-if="report.inputRequired === 'asset_id'">
                <input
                  v-model="reportInputs[report.id]"
                  type="text"
                  class="reports-table-input-field"
                  placeholder="e.g. asset UUID"
                  :aria-label="`Asset ID for ${report.name}`"
                />
              </template>
              <span v-else class="reports-table-input-none">—</span>
            </td>
            <td class="reports-table-csv">
              <button
                v-if="report.csvPath"
                type="button"
                class="report-download report-download-sm"
                :disabled="report.inputRequired && !reportInputs[report.id]"
                @click="download(report.csvPath!, report.csvName!, report)"
              >
                Download CSV
              </button>
              <span v-else class="reports-table-empty">—</span>
            </td>
            <td class="reports-table-pdf">
              <button
                v-if="report.pdfPath"
                type="button"
                class="report-download report-download-sm"
                :disabled="report.inputRequired && !reportInputs[report.id]"
                @click="downloadPdf(report.pdfPath!, report.pdfName!, report)"
              >
                Download PDF
              </button>
              <span v-else class="reports-table-empty">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { request, getCustomers } from '../api'
import type { CustomerSummary } from '../api'

interface ReportRow {
  id: string
  name: string
  summary: string
  inputRequired?: 'asset_id'
  csvPath?: string
  csvName?: string
  pdfPath?: string
  pdfName?: string
}

const reports: ReportRow[] = [
  { id: 'asset-disposition', name: 'Asset disposition', summary: 'Summary of all assets and their current disposition status (received, sanitized, destroyed, released).', csvPath: 'reports/asset-disposition/', csvName: 'asset_disposition' },
  { id: 'certificate-of-destruction', name: 'Certificate of destruction', summary: 'Evidence of destruction for assets that have been physically destroyed, suitable for compliance records.', csvPath: 'reports/certificate-of-destruction/', csvName: 'certificate_of_destruction', pdfPath: 'reports/certificate-of-destruction/', pdfName: 'certificate_of_destruction' },
  { id: 'chain-of-custody', name: 'Chain of custody', summary: 'Audit events for a single asset. Enter an asset ID to download CSV or PDF.', inputRequired: 'asset_id', csvPath: 'reports/chain-of-custody/', csvName: 'chain_of_custody', pdfPath: 'reports/chain-of-custody/', pdfName: 'chain_of_custody' },
  { id: 'user-action-logs', name: 'User action logs', summary: 'Audit trail of user actions (intake, custody, sanitization) for traceability and certification.', csvPath: 'reports/user-action-logs/', csvName: 'user_action_logs' },
  { id: 'kpi-dashboard', name: 'KPI dashboard export', summary: 'Assets processed by employee, stage distribution, sustainability totals, and open workflow alerts.', csvPath: 'reports/kpis/', csvName: 'kpi_report', pdfPath: 'kpi-pdf', pdfName: 'kpi_report' },
  { id: 'audit-events', name: 'Audit events', summary: 'Full audit event export (same data as user action logs) for compliance and external systems.', csvPath: 'reports/audit-events/', csvName: 'audit_events' },
  { id: 'audit-summary', name: 'Audit summary', summary: 'Counts by event type and by user; optional customer and date range.', csvPath: 'reports/audit-summary/', csvName: 'audit_summary' },
  { id: 'shipments', name: 'Shipments', summary: 'List of shipments (work order, carrier, tracking, shipped_at, destination type).', csvPath: 'reports/shipments/', csvName: 'shipments' },
]

const downloadError = ref('')
const customers = ref<CustomerSummary[]>([])
const selectedCustomerId = ref('')
const createdAfter = ref('')
const createdBefore = ref('')
const reportInputs = reactive<Record<string, string>>({})

function reportQueryString(assetId?: string): string {
  const params = new URLSearchParams()
  params.set('format', 'csv')
  if (selectedCustomerId.value) params.set('customer_id', selectedCustomerId.value)
  if (createdAfter.value) params.set('created_after', createdAfter.value + 'T00:00:00Z')
  if (createdBefore.value) params.set('created_before', createdBefore.value + 'T23:59:59Z')
  if (assetId) params.set('asset_id', assetId)
  return params.toString()
}

function reportQueryStringForPdf(assetId?: string): string {
  const params = new URLSearchParams()
  if (selectedCustomerId.value) params.set('customer_id', selectedCustomerId.value)
  if (createdAfter.value) params.set('created_after', createdAfter.value + 'T00:00:00Z')
  if (createdBefore.value) params.set('created_before', createdBefore.value + 'T23:59:59Z')
  if (assetId) params.set('asset_id', assetId)
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

async function download(path: string, name: string, report: ReportRow) {
  const assetId = report.inputRequired === 'asset_id' ? reportInputs[report.id] : undefined
  if (report.inputRequired === 'asset_id' && !assetId) return
  downloadError.value = ''
  const pathNorm = path.startsWith('/') ? path : `/${path}`
  const qs = reportQueryString(assetId)
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

async function downloadPdf(path: string, name: string, report: ReportRow) {
  const assetId = report.inputRequired === 'asset_id' ? reportInputs[report.id] : undefined
  if (report.inputRequired === 'asset_id' && !assetId) return
  downloadError.value = ''
  const pathNorm = path.startsWith('/') ? path : `/${path}`
  const qs = reportQueryStringForPdf(assetId)
  const sep = pathNorm.includes('?') ? '&' : '?'
  const url = qs ? `${pathNorm}?${qs}&format=pdf` : `${pathNorm}${sep}format=pdf`
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
/* Filter and table styles come from src/styles/views/_reports.scss */
</style>
