<template>
  <div class="reports">
    <header class="reports-header">
      <p class="reports-description">
        Download compliance and operational reports for audit, disposition tracking, and chain of custody.
        Click a report to open it and download CSV or PDF.
      </p>
      <div class="reports-search-row">
        <label for="reports-search" class="reports-search-label">Search reports</label>
        <input
          id="reports-search"
          v-model="reportSearchQuery"
          type="search"
          class="reports-search-input"
          placeholder="Filter by name or summary…"
          aria-label="Search reports by name or summary"
        />
      </div>
    </header>
    <div class="reports-table-wrap">
      <table class="reports-table">
        <thead>
          <tr>
            <th class="reports-table-name">Name</th>
            <th class="reports-table-summary">Summary</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="group in reportsBySectionFiltered" :key="group.section">
            <tr class="reports-section-row">
              <td colspan="2" class="reports-section-heading">{{ group.section }}</td>
            </tr>
            <tr
              v-for="report in group.reports"
              :key="report.id"
              class="reports-table-row reports-table-row-clickable"
              @click="openReportModal(report)"
            >
              <td class="reports-table-name">{{ report.name }}</td>
              <td class="reports-table-summary">{{ report.summary }}</td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div v-if="selectedReport" class="modal-backdrop" @click.self="closeReportModal">
      <div class="modal report-modal" @click.stop>
        <h2 class="report-modal-title">{{ selectedReport.name }}</h2>
        <p class="report-modal-summary">{{ selectedReport.summary }}</p>

        <p v-if="selectedReport.filters.customer || selectedReport.filters.dateRange || selectedReport.filters.userId" class="report-modal-hint">
          Leave filters empty for a full snapshot where applicable.
        </p>

        <div v-if="selectedReport.filters.customer || selectedReport.filters.dateRange || selectedReport.filters.userId" class="report-modal-filters">
          <div v-if="selectedReport.filters.customer" class="report-modal-field">
            <label class="report-modal-label" for="report-modal-customer">Customer</label>
            <select id="report-modal-customer" v-model="selectedCustomerId" class="report-modal-select" aria-label="Filter by customer">
              <option value="">All (system-wide)</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div v-if="selectedReport.filters.dateRange" class="report-modal-daterow">
            <div class="report-modal-field">
              <label class="report-modal-label" for="report-modal-from">From</label>
              <input id="report-modal-from" v-model="createdAfter" type="date" class="report-modal-input" />
            </div>
            <div class="report-modal-field">
              <label class="report-modal-label" for="report-modal-to">To</label>
              <input id="report-modal-to" v-model="createdBefore" type="date" class="report-modal-input" />
            </div>
          </div>
          <div v-if="selectedReport.filters.bucket" class="report-modal-field">
            <label class="report-modal-label" for="report-modal-bucket">Group by</label>
            <select id="report-modal-bucket" v-model="selectedBucket" class="report-modal-select" aria-label="Time bucket">
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
          <div v-if="selectedReport.filters.userId" class="report-modal-field report-modal-field-users">
            <label class="report-modal-label" for="report-modal-users">User(s)</label>
            <select
              id="report-modal-users"
              v-model="selectedUserIds"
              class="report-modal-select report-modal-select-multi"
              multiple
              aria-label="Filter by user (hold Ctrl/Cmd to select multiple; empty = all users)"
            >
              <option v-for="u in employees" :key="u.id" :value="u.id">{{ u.username }}{{ u.email ? ` (${u.email})` : '' }}</option>
            </select>
            <span class="report-modal-field-hint">Hold Ctrl/Cmd to select multiple; leave empty for all users.</span>
          </div>
        </div>

        <div v-if="selectedReport.filters.assetId" class="report-modal-field report-modal-input-required">
          <label class="report-modal-label" :for="`report-modal-asset-${selectedReport.id}`">
            Asset ID {{ selectedReport.filters.assetId === 'required' ? '(required)' : '(optional)' }}
          </label>
          <input
            :id="`report-modal-asset-${selectedReport.id}`"
            v-model="reportInputs[selectedReport.id]"
            type="text"
            class="report-modal-input"
            placeholder="e.g. asset UUID"
            :aria-label="`Asset ID for ${selectedReport.name}`"
          />
        </div>

        <p v-if="downloadError" class="report-modal-error">{{ downloadError }}</p>

        <div class="report-modal-actions">
          <button
            v-if="selectedReport.csvPath"
            type="button"
            class="report-download"
            :disabled="isDownloadDisabled(selectedReport)"
            @click="download(selectedReport.csvPath!, selectedReport.csvName!, selectedReport)"
          >
            Download CSV
          </button>
          <button
            v-if="selectedReport.pdfPath"
            type="button"
            class="report-download"
            :disabled="isDownloadDisabled(selectedReport)"
            @click="downloadPdf(selectedReport.pdfPath!, selectedReport.pdfName!, selectedReport)"
          >
            Download PDF
          </button>
          <button type="button" class="btn-secondary" @click="closeReportModal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { request, getCustomers, getUsersByType, API_URL } from '../api'
import type { CustomerSummary, UserSummary } from '../api'

/** Which filters this report supports. Omitted = not supported. Leave filters empty for full snapshot where applicable. */
interface ReportFiltersSpec {
  customer?: boolean
  dateRange?: boolean
  assetId?: 'required' | 'optional'
  userId?: boolean  // single or multiple users; empty = all users (full snapshot)
  bucket?: boolean  // group by day/week/month (for time-bucketed reports)
}

/** High-level use case for grouping; each report appears in exactly one section. */
const REPORT_SECTIONS = ['Compliance & certificates', 'Audit & activity', 'Assets & lifecycle', 'Operations & throughput', 'Dashboard & KPIs'] as const

interface ReportRow {
  id: string
  name: string
  summary: string
  section: (typeof REPORT_SECTIONS)[number]
  filters: ReportFiltersSpec
  inputRequired?: 'asset_id'  // derived: assetId === 'required'
  defaultBucket?: 'day' | 'week' | 'month'
  csvPath?: string
  csvName?: string
  pdfPath?: string
  pdfName?: string
}

const reports: ReportRow[] = [
  { id: 'certificate-of-destruction', name: 'Certificate of destruction', summary: 'Evidence of destruction for assets that have been physically destroyed, suitable for compliance records.', section: 'Compliance & certificates', filters: { customer: true, assetId: 'optional' }, csvPath: 'reports/certificate-of-destruction/', csvName: 'certificate_of_destruction', pdfPath: 'reports/certificate-of-destruction/', pdfName: 'certificate_of_destruction' },
  { id: 'chain-of-custody', name: 'Chain of custody', summary: 'Audit events for a single asset. Enter an asset ID to download CSV or PDF.', section: 'Compliance & certificates', filters: { customer: true, assetId: 'required' }, inputRequired: 'asset_id', csvPath: 'reports/chain-of-custody/', csvName: 'chain_of_custody', pdfPath: 'reports/chain-of-custody/', pdfName: 'chain_of_custody' },
  { id: 'compliance-snapshot', name: 'Compliance snapshot', summary: 'Counts of certificates generated, assets destroyed, and chain-of-custody events in a date range. Optional customer.', section: 'Compliance & certificates', filters: { customer: true, dateRange: true }, csvPath: 'reports/compliance-snapshot/', csvName: 'compliance_snapshot' },
  { id: 'user-action-logs', name: 'User action logs', summary: 'Audit trail of user actions (intake, custody, sanitization). Filter by customer or date range; leave empty for full snapshot.', section: 'Audit & activity', filters: { customer: true, dateRange: true }, csvPath: 'reports/user-action-logs/', csvName: 'user_action_logs' },
  { id: 'audit-events', name: 'Audit events', summary: 'Full audit event export. Filter by customer, date range, or user(s); leave all empty for full snapshot.', section: 'Audit & activity', filters: { customer: true, dateRange: true, userId: true }, csvPath: 'reports/audit-events/', csvName: 'audit_events' },
  { id: 'audit-summary', name: 'Audit summary', summary: 'Counts by event type and by user. Optional customer, date range, and user filter; leave empty for full snapshot.', section: 'Audit & activity', filters: { customer: true, dateRange: true, userId: true }, csvPath: 'reports/audit-summary/', csvName: 'audit_summary' },
  { id: 'user-activity-summary', name: 'User activity summary', summary: 'Number of audit events per user over a date range. Optional customer filter.', section: 'Audit & activity', filters: { customer: true, dateRange: true }, csvPath: 'reports/user-activity-summary/', csvName: 'user_activity_summary' },
  { id: 'asset-disposition', name: 'Asset disposition', summary: 'Summary of all assets and their current disposition status (received, sanitized, destroyed, released).', section: 'Assets & lifecycle', filters: { customer: true, assetId: 'optional' }, csvPath: 'reports/asset-disposition/', csvName: 'asset_disposition' },
  { id: 'asset-lifecycle-summary', name: 'Asset lifecycle summary', summary: 'Counts of assets by status and by location. Optional customer and date range.', section: 'Assets & lifecycle', filters: { customer: true, dateRange: true }, csvPath: 'reports/asset-lifecycle-summary/', csvName: 'asset_lifecycle_summary' },
  { id: 'shipments', name: 'Shipments', summary: 'List of shipments (work order, carrier, tracking, shipped_at, destination type).', section: 'Operations & throughput', filters: { customer: true, dateRange: true }, csvPath: 'reports/shipments/', csvName: 'shipments' },
  { id: 'shipments-over-time', name: 'Shipments over time', summary: 'Count of shipments by date range and carrier breakdown. Optional customer and date range.', section: 'Operations & throughput', filters: { customer: true, dateRange: true }, csvPath: 'reports/shipments-over-time/', csvName: 'shipments_over_time' },
  { id: 'work-order-throughput', name: 'Work order throughput', summary: 'Work orders created and completed per week or month; average time to complete. Optional customer and date range.', section: 'Operations & throughput', filters: { customer: true, dateRange: true, bucket: true }, defaultBucket: 'week', csvPath: 'reports/work-order-throughput/', csvName: 'work_order_throughput' },
  { id: 'request-to-asset-funnel', name: 'Request-to-asset funnel', summary: 'Funnel metrics: requests received, accepted, assets created, destroyed, and shipped. Optional customer and date range.', section: 'Operations & throughput', filters: { customer: true, dateRange: true }, csvPath: 'reports/request-to-asset-funnel/', csvName: 'request_to_asset_funnel' },
  { id: 'intake-requests-over-time', name: 'Intake requests over time', summary: 'Count of intake requests by status and by time period (day/week/month). Optional customer and date range.', section: 'Operations & throughput', filters: { customer: true, dateRange: true, bucket: true }, defaultBucket: 'day', csvPath: 'reports/intake-requests-over-time/', csvName: 'intake_requests_over_time' },
  { id: 'kpi-dashboard', name: 'KPI dashboard export', summary: 'Assets processed by employee, stage distribution, sustainability totals, and open workflow alerts.', section: 'Dashboard & KPIs', filters: { customer: true }, csvPath: 'reports/kpis/', csvName: 'kpi_report', pdfPath: 'kpi-pdf', pdfName: 'kpi_report' },
]

const reportSearchQuery = ref('')
const downloadError = ref('')
const customers = ref<CustomerSummary[]>([])
const employees = ref<UserSummary[]>([])
const selectedCustomerId = ref('')
const createdAfter = ref('')
const createdBefore = ref('')
const selectedUserIds = ref<string[]>([])
const selectedBucket = ref<'day' | 'week' | 'month'>('day')
const reportInputs = reactive<Record<string, string>>({})
const selectedReport = ref<ReportRow | null>(null)

/** Groups reports by section in display order; each report appears once. */
const reportsBySection = computed(() => {
  const map = new Map<string, ReportRow[]>()
  for (const section of REPORT_SECTIONS) map.set(section, [])
  for (const report of reports) {
    const list = map.get(report.section)
    if (list) list.push(report)
  }
  return REPORT_SECTIONS.map((section) => ({ section, reports: map.get(section) || [] })).filter((g) => g.reports.length > 0)
})

const reportSearchLower = computed(() => reportSearchQuery.value.trim().toLowerCase())

/** Sections and reports filtered by search (name or summary). */
const reportsBySectionFiltered = computed(() => {
  if (!reportSearchLower.value) return reportsBySection.value
  return reportsBySection.value
    .map((g) => ({
      section: g.section,
      reports: g.reports.filter(
        (r) =>
          r.name.toLowerCase().includes(reportSearchLower.value) ||
          r.summary.toLowerCase().includes(reportSearchLower.value)
      ),
    }))
    .filter((g) => g.reports.length > 0)
})

function openReportModal(report: ReportRow) {
  selectedReport.value = report
  downloadError.value = ''
  if (report.filters.bucket && report.defaultBucket) selectedBucket.value = report.defaultBucket
}

function closeReportModal() {
  selectedReport.value = null
  downloadError.value = ''
}

function reportQueryString(report: ReportRow, assetId?: string): string {
  const params = new URLSearchParams()
  params.set('format', 'csv')
  if (report.filters.customer && selectedCustomerId.value) params.set('customer_id', selectedCustomerId.value)
  if (report.filters.dateRange) {
    if (createdAfter.value) params.set('created_after', createdAfter.value + 'T00:00:00Z')
    if (createdBefore.value) params.set('created_before', createdBefore.value + 'T23:59:59Z')
  }
  if (report.filters.assetId && assetId) params.set('asset_id', assetId)
  if (report.filters.userId && selectedUserIds.value.length) params.set('user_ids', selectedUserIds.value.join(','))
  if (report.filters.bucket) params.set('bucket', selectedBucket.value)
  return params.toString()
}

function reportQueryStringForPdf(report: ReportRow, assetId?: string): string {
  const params = new URLSearchParams()
  if (report.filters.customer && selectedCustomerId.value) params.set('customer_id', selectedCustomerId.value)
  if (report.filters.dateRange) {
    if (createdAfter.value) params.set('created_after', createdAfter.value + 'T00:00:00Z')
    if (createdBefore.value) params.set('created_before', createdBefore.value + 'T23:59:59Z')
  }
  if (report.filters.assetId && assetId) params.set('asset_id', assetId)
  if (report.filters.userId && selectedUserIds.value.length) params.set('user_ids', selectedUserIds.value.join(','))
  if (report.filters.bucket) params.set('bucket', selectedBucket.value)
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
    const [custList, empList] = await Promise.all([getCustomers(), getUsersByType('EMPLOYEE')])
    customers.value = custList
    employees.value = empList
  } catch {
    customers.value = []
    employees.value = []
  }
})

function isDownloadDisabled(report: ReportRow): boolean {
  if (report.filters.assetId === 'required') return !reportInputs[report.id]?.trim()
  return false
}

async function download(path: string, name: string, report: ReportRow) {
  const assetId = report.filters.assetId ? reportInputs[report.id]?.trim() : undefined
  if (report.filters.assetId === 'required' && !assetId) return
  downloadError.value = ''
  const pathNorm = path.startsWith('/') ? path : `/${path}`
  const qs = reportQueryString(report, assetId)
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
  const assetId = report.filters.assetId ? reportInputs[report.id]?.trim() : undefined
  if (report.filters.assetId === 'required' && !assetId) return
  downloadError.value = ''
  const pathNorm = path.startsWith('/') ? path : `/${path}`
  const qs = reportQueryStringForPdf(report, assetId)
  const sep = pathNorm.includes('?') ? '&' : '?'
  const urlPath = qs ? `${pathNorm}?${qs}&format=pdf` : `${pathNorm}${sep}format=pdf`
  const fullUrl = urlPath.startsWith('http') ? urlPath : `${API_URL}${urlPath.startsWith('/') ? urlPath : '/' + urlPath}`
  try {
    // Use fetch directly for PDF downloads to avoid Content-Type: application/json header
    const r = await fetch(fullUrl, { credentials: 'include' })
    if (!r.ok) {
      // For asset-not-found (400) and similar, show a clear, user-friendly message
      if (r.status === 400) {
        downloadError.value = 'Asset not found. Use asset UUID.'
      } else {
        const text = await r.text()
        let msg = ''
        try {
          const j = JSON.parse(text)
          if (j.detail) msg = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail)
        } catch {
          msg = text.slice(0, 200) || `HTTP ${r.status}`
        }
        downloadError.value = msg || 'Failed to generate PDF report.'
      }
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

<style scoped lang="scss">
@use '../styles/views/reports';
</style>