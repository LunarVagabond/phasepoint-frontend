<template>
  <section class="dashboard-grid">
    <article class="panel panel-metrics">
      <header class="panel-header">
        <h2>Sustainability Impact</h2>
        <span class="pill">Live Metrics</span>
      </header>
      <div class="metrics-grid">
        <div class="metric-card">
          <p class="metric-label">Total Weight</p>
          <p class="metric-value">{{ impact?.total_weight_kg ?? 0 }} <span>kg</span></p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Recycled</p>
          <p class="metric-value">{{ impact?.recycled_percent ?? 0 }}<span>%</span></p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Disposed</p>
          <p class="metric-value">{{ impact?.disposed_percent ?? 0 }}<span>%</span></p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Reused</p>
          <p class="metric-value">{{ impact?.reused_percent ?? 0 }}<span>%</span></p>
        </div>
      </div>
      <div class="chart-row">
        <div class="donut-wrap">
          <div class="donut" :style="donutStyle"></div>
          <p>Disposition Mix</p>
        </div>
        <div class="legend">
          <div><span class="dot recycled"></span> Recycled</div>
          <div><span class="dot disposed"></span> Disposed</div>
          <div><span class="dot reused"></span> Reused</div>
        </div>
      </div>

      <div class="carbon-card">
        <div class="carbon-header">
          <h3>Estimated Carbon Elimination</h3>
          <span class="todo-pill">TODO Calc</span>
        </div>
        <p class="carbon-value">{{ estimatedCarbonKg.toFixed(1) }} <span>kg CO2e</span></p>
        <div class="carbon-chart" role="img" aria-label="Estimated carbon elimination progress">
          <div class="carbon-fill" :style="{ width: `${estimatedCarbonPercent}%` }"></div>
        </div>
        <p class="carbon-note">
          TODO: Replace placeholder formula with audited ITAD carbon methodology and lifecycle factors.
        </p>
      </div>
    </article>

    <article class="panel panel-history">
      <header class="panel-header">
        <h2>Request History</h2>
        <router-link v-if="!isReadonlyPortal" to="/customer-portal/requests/new" class="btn-link">Create Request</router-link>
      </header>
      <div v-if="requests.length === 0" class="empty-state">No requests yet. Start by creating your first disposal request.</div>
      <div v-else class="request-table">
        <div class="table-head">
          <span class="col-date">Date</span><span class="col-status">Status</span><span class="col-items">Items</span><span class="col-logistics">Logistics</span>
        </div>
        <div v-for="r in requests" :key="r.id" class="table-row request-row" @click="openRequest(r.id)">
          <span class="col-date">{{ formatDate(r.created_at) }}</span>
          <span class="col-status"><span class="status-badge" :class="statusClass(r.status)">{{ prettyStatus(r.status) }}</span></span>
          <span class="col-items">{{ r.asset_quantities_display || r.asset_types_display.join(', ') }}</span>
          <span class="col-logistics">{{ logisticsLabel(r) }}</span>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCustomerContext, getCustomerSustainabilityImpact, getMyIntakeRequests } from '../api'
import type { IntakeRequestSummary } from '../api'

const requests = ref<IntakeRequestSummary[]>([])
const impact = ref<null | Awaited<ReturnType<typeof getCustomerSustainabilityImpact>>>(null)
const route = useRoute()
const router = useRouter()
const isReadonlyPortal = computed(() => route.path.includes('/employee-portal/customers/') || Boolean(route.meta.customerPortalReadonly))

onMounted(async () => {
  if (isReadonlyPortal.value) {
    const customerId = String(route.params.customerId || '')
    if (!customerId) return
    const context = await getCustomerContext(customerId)
    requests.value = context.requests.map((r) => ({
      id: r.id,
      asset_types: [],
      asset_quantities: r.asset_quantities || {},
      asset_types_display: [],
      asset_quantities_display: Object.entries(r.asset_quantities || {}).map(([k, v]) => `${k}: ${v}`).join(', '),
      customer: context.customer.id,
      customer_name: context.customer.name,
      company_name_raw: context.customer.name,
      contact_name: '',
      contact_email: context.customer.email || '',
      contact_phone: context.customer.phone || '',
      notes: '',
      internal_notes: '',
      status: r.status,
      rejected_reason: '',
      accepted_by: null,
      accepted_at: null,
      received_at: r.received_at ?? null,
      delivery_type: r.delivery_type,
      pickup_scheduled_at: r.pickup_scheduled_at ?? null,
      drop_off_preferred_start: r.drop_off_preferred_start ?? null,
      drop_off_preferred_end: r.drop_off_preferred_end ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }))
    const total = context.sustainability.total_weight_kg || 0
    const recycled = context.sustainability.recycled_weight_kg || 0
    const disposed = context.sustainability.disposed_weight_kg || 0
    const reused = context.sustainability.reused_weight_kg || 0
    impact.value = {
      total_weight_kg: total,
      recycled_weight_kg: recycled,
      disposed_weight_kg: disposed,
      reused_weight_kg: reused,
      recycled_percent: total ? (recycled / total) * 100 : 0,
      disposed_percent: total ? (disposed / total) * 100 : 0,
      reused_percent: total ? (reused / total) * 100 : 0,
    }
    return
  }
  requests.value = await getMyIntakeRequests()
  impact.value = await getCustomerSustainabilityImpact()
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function prettyStatus(status: string) {
  return status.replace(/_/g, ' ')
}

function statusClass(status: string) {
  return `status-${status.toLowerCase()}`
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

function openRequest(id: string) {
  const basePath = isReadonlyPortal.value
    ? `/employee-portal/customers/${String(route.params.customerId || '')}/portal`
    : '/customer-portal'
  router.push(`${basePath}/requests/${id}`)
}

const donutStyle = computed(() => {
  const recycled = impact.value?.recycled_percent ?? 0
  const disposed = impact.value?.disposed_percent ?? 0
  const reused = impact.value?.reused_percent ?? 0
  const recycledEnd = recycled
  const disposedEnd = recycled + disposed
  const reusedEnd = recycled + disposed + reused
  return {
    background: `conic-gradient(#10b981 0% ${recycledEnd}%, #ef4444 ${recycledEnd}% ${disposedEnd}%, #3b82f6 ${disposedEnd}% ${reusedEnd}%, #cbd5e1 ${reusedEnd}% 100%)`,
  }
})

const estimatedCarbonKg = computed(() => {
  // TODO: Replace with real carbon-elimination calculation from sustainability model.
  const totalWeightKg = impact.value?.total_weight_kg ?? 0
  return totalWeightKg * 1.8
})

const estimatedCarbonPercent = computed(() => {
  const value = estimatedCarbonKg.value
  const cap = 10000
  return Math.max(0, Math.min(100, (value / cap) * 100))
})
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-6;
}

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: $radius-lg;
  box-shadow: var(--shadow-sm);
  padding: $space-6;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-4;
}

.panel-header h2 { margin: 0; }
.pill {
  background: rgba(var(--color-primary-rgb, 37, 99, 235), 0.12);
  color: var(--color-primary);
  padding: $space-1 $space-2;
  border-radius: 999px;
  font-size: $font-size-sm;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: $space-3;
}

.metric-card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  padding: $space-4;
}

.metric-label { margin: 0 0 $space-1; color: var(--color-text-muted); font-size: $font-size-sm; }
.metric-value { margin: 0; font-size: 1.75rem; font-weight: 700; }
.metric-value span { font-size: 1rem; font-weight: 500; color: var(--color-text-muted); }

.chart-row { margin-top: $space-5; display: flex; align-items: center; gap: $space-8; }
.donut-wrap { display: flex; flex-direction: column; align-items: center; gap: $space-2; }
.donut {
  width: 140px; height: 140px; border-radius: 50%;
  position: relative;
}
.donut::after {
  content: "";
  position: absolute;
  inset: 18px;
  background: var(--color-surface);
  border-radius: 50%;
}

.legend { display: grid; gap: $space-2; color: var(--color-text-muted); }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: $space-2; }
.dot.recycled { background: #10b981; }
.dot.disposed { background: #ef4444; }
.dot.reused { background: #3b82f6; }

.carbon-card {
  margin-top: $space-5;
  padding: $space-4;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.06));
}
.carbon-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
}
.carbon-header h3 { margin: 0; font-size: $font-size-lg; }
.todo-pill {
  background: rgba(245, 158, 11, 0.18);
  color: #92400e;
  border-radius: 999px;
  padding: $space-1 $space-2;
  font-size: $font-size-sm;
  font-weight: 600;
}
.carbon-value {
  margin: $space-3 0 $space-2;
  font-size: 1.8rem;
  font-weight: 700;
}
.carbon-value span {
  font-size: 1rem;
  color: var(--color-text-muted);
  font-weight: 500;
}
.carbon-chart {
  width: 100%;
  height: 12px;
  border-radius: 999px;
  background: #dbeafe;
  overflow: hidden;
}
.carbon-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #3b82f6);
  transition: width 200ms ease;
}
.carbon-note {
  margin: $space-2 0 0;
  font-size: $font-size-sm;
  color: var(--color-text-muted);
}

.btn-link { font-weight: 600; }
.empty-state { padding: $space-6; color: var(--color-text-muted); background: var(--color-background); border-radius: $radius-md; }

.request-table { border: 1px solid var(--color-border); border-radius: $radius-md; overflow: hidden; }
.table-head, .table-row {
  display: grid;
  grid-template-columns: 200px 120px minmax(0, 1fr) minmax(240px, 2fr);
  gap: $space-3;
  padding: $space-3 $space-4;
  align-items: center;
}
.table-head { background: var(--color-background); font-size: $font-size-sm; color: var(--color-text-muted); font-weight: 600; }
.table-row + .table-row { border-top: 1px solid var(--color-border); }
.request-row { cursor: pointer; }
.request-row:hover { background: rgba(148, 163, 184, 0.12); }
.col-logistics { white-space: nowrap; min-width: 0; }

.status-badge {
  display: inline-block; border-radius: 999px; padding: $space-1 $space-2; font-size: $font-size-sm; font-weight: 600;
  background: #e2e8f0; color: #0f172a;
}
.status-pending { background: #fef3c7; color: #92400e; }
.status-seen { background: #dbeafe; color: #1d4ed8; }
.status-accepted { background: #dcfce7; color: #166534; }
.status-completed { background: #ccfbf1; color: #0f766e; }
.status-rejected { background: #fee2e2; color: #b91c1c; }

@media (max-width: 960px) {
  .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .table-head, .table-row { grid-template-columns: 1fr; }
  .chart-row { flex-direction: column; align-items: flex-start; }
}
</style>
