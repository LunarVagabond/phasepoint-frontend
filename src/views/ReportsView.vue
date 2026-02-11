<template>
  <div class="reports">
    <header class="reports-header">
      <p class="reports-description">
        Download compliance and operational reports for audit, disposition tracking, and chain of custody.
        Reports are available in CSV format for use in spreadsheets or external systems.
      </p>
    </header>
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
import { request } from '../api'

async function download(path: string, name: string) {
  const pathNorm = path.startsWith('/') ? path : `/${path}`
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
}
</script>

