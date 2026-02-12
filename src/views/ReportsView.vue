<template>
  <div class="reports">
    <header class="reports-header">
      <p class="reports-description">
        Download compliance and operational reports for audit, disposition tracking, and chain of custody.
        Reports are available in CSV format for use in spreadsheets or external systems.
      </p>
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
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { request } from '../api'

const downloadError = ref('')

async function download(path: string, name: string) {
  downloadError.value = ''
  const pathNorm = path.startsWith('/') ? path : `/${path}`
  try {
    const r = await request(`${pathNorm}?format=csv`)
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
    a.download = `${name}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  } catch (e) {
    downloadError.value = e instanceof Error ? e.message : 'Failed to download report'
  }
}

async function downloadPdf(path: string, name: string) {
  downloadError.value = ''
  const pathNorm = path.startsWith('/') ? path : `/${path}`
  try {
    const r = await request(`${pathNorm}?format=pdf`)
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
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.pdf`
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    downloadError.value = e instanceof Error ? e.message : 'Failed to download PDF'
  }
}
</script>

