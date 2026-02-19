<template>
  <section class="dashboard-grid">
    <article class="panel panel-quick-access">
      <header class="panel-header">
        <h2>Quick Access</h2>
      </header>
      <div class="quick-access-grid">
        <router-link :to="`${basePath}/tracking/requests`" class="quick-access-card">
          <div class="quick-access-icon">📄</div>
          <div class="quick-access-content">
            <h3>Requests</h3>
            <p class="quick-access-count">{{ requests.length }} requests</p>
          </div>
        </router-link>
        <router-link :to="`${basePath}/tracking/assets`" class="quick-access-card">
          <div class="quick-access-icon">📦</div>
          <div class="quick-access-content">
            <h3>My Assets</h3>
            <p class="quick-access-count">{{ assetSummary?.total || 0 }} total assets</p>
          </div>
        </router-link>
        <router-link :to="`${basePath}/tracking/shipments`" class="quick-access-card">
          <div class="quick-access-icon">🚚</div>
          <div class="quick-access-content">
            <h3>My Shipments</h3>
            <p class="quick-access-count">{{ recentShipments.length }} recent shipments</p>
          </div>
        </router-link>
        <router-link :to="`${basePath}/tracking/audit`" class="quick-access-card">
          <div class="quick-access-icon">📋</div>
          <div class="quick-access-content">
            <h3>Audit Trail</h3>
            <p class="quick-access-desc">View all activity</p>
          </div>
        </router-link>
      </div>
    </article>

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
          <p class="metric-value">{{ (impact?.recycled_percent ?? 0).toFixed(2) }}<span>%</span></p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Disposed</p>
          <p class="metric-value">{{ (impact?.disposed_percent ?? 0).toFixed(2) }}<span>%</span></p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Reused</p>
          <p class="metric-value">{{ (impact?.reused_percent ?? 0).toFixed(2) }}<span>%</span></p>
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
          <!--TODO: Add a "run estimate" where users can see how much elmination if they improve certain factors-->
          <h3>Estimated Carbon Elimination</h3>
          <span class="pill">Calculated</span>
        </div>
        <p class="carbon-value">{{ estimatedCarbonKg.toFixed(1) }} <span>kg CO2e</span></p>
        <div class="carbon-chart" role="img" aria-label="Estimated carbon elimination progress">
          <div class="carbon-fill" :style="{ width: `${estimatedCarbonPercent}%` }"></div>
        </div>
        <p class="carbon-note">
          Based on ITAD industry standards: Reused assets avoid new production emissions (~300 kg CO2e/kg), 
          recycled materials avoid landfill emissions (~3 kg CO2e/kg), and proper disposal reduces environmental impact.
        </p>
      </div>
    </article>

    <article v-if="assetSummary && assetSummary.total > 0" class="panel panel-asset-summary">
      <header class="panel-header">
        <h2>Asset Summary</h2>
        <router-link :to="`${basePath}/tracking/assets`" class="btn-link">View All</router-link>
      </header>
      <div class="asset-summary-grid">
        <div class="summary-stat">
          <p class="stat-label">Total Assets</p>
          <p class="stat-value">{{ assetSummary.total }}</p>
        </div>
        <div class="summary-stat">
          <p class="stat-label">By Status</p>
          <div class="stat-breakdown">
            <span v-for="(count, status) in assetSummary.byStatus" :key="status" class="stat-item">
              {{ formatStatus(status) }}: {{ count }}
            </span>
          </div>
        </div>
        <div class="summary-stat">
          <p class="stat-label">By Location</p>
          <div class="stat-breakdown">
            <span v-for="(count, location) in assetSummary.byLocation" :key="location" class="stat-item">
              {{ getLocationLabel(location) }}: {{ count }}
            </span>
          </div>
        </div>
      </div>
      <div v-if="recentAssets.length > 0" class="recent-assets">
        <h3>Recent Assets</h3>
        <div class="recent-items-list">
          <router-link
            v-for="asset in recentAssets.slice(0, 5)"
            :key="asset.id"
            :to="`${basePath}/assets/${asset.id}`"
            class="recent-item"
          >
            <strong>{{ formatAssetId(asset.id) }}</strong>
            <span class="recent-item-meta">{{ formatStatus(asset.status) }} · {{ getLocationLabel(asset.location) }}</span>
          </router-link>
        </div>
      </div>
    </article>

    <article v-if="recentShipments.length > 0" class="panel panel-shipments">
      <header class="panel-header">
        <h2>Recent Shipments</h2>
        <router-link :to="`${basePath}/tracking/shipments`" class="btn-link">View All</router-link>
      </header>
      <div class="shipments-list">
        <router-link
          v-for="shipment in recentShipments"
          :key="shipment.id"
          :to="`${basePath}/shipments/${shipment.id}`"
          class="shipment-item"
        >
          <div class="shipment-item-main">
            <strong>{{ shipment.tracking_number || 'No tracking' }}</strong>
            <span class="shipment-meta">{{ shipment.carrier || '—' }} · {{ shipment.destination_type || '—' }}</span>
          </div>
          <div class="shipment-item-status">
            <span class="badge" :data-status="shipment.status">{{ shipment.status }}</span>
            <span class="shipment-count">{{ shipment.asset_count }} assets</span>
          </div>
        </router-link>
      </div>
    </article>

    <article class="panel panel-history">
      <header class="panel-header">
        <h2>Request History</h2>
        <router-link v-if="!isReadonlyPortal" :to="`${basePath}/requests/new`" class="btn-link">Create Request</router-link>
      </header>
      <div v-if="requests.length === 0" class="empty-state">No requests yet. Start by creating your first disposal request.</div>
      <div v-else class="request-table">
        <div class="table-head">
          <span class="col-date">Date</span><span class="col-status">Status</span><span class="col-items">Items</span><span class="col-logistics">Logistics</span>
        </div>
        <div v-for="r in requests" :key="r.id" class="table-row request-row" @click="openRequest(r.id)">
          <span class="col-date">{{ formatDate(r.created_at) }}</span>
          <span class="col-status"><span class="badge" :data-status="r.status">{{ prettyStatus(r.status) }}</span></span>
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
import { getCustomerContext, getCustomerSustainabilityImpact, getMyIntakeRequests, getCustomerAssets, getCustomerShipments, getLocationLabel } from '../api'
import type { IntakeRequestSummary, AssetSummary, ShipmentListSummary } from '../api'
import { formatAssetId } from '../utils/format'

const requests = ref<IntakeRequestSummary[]>([])
const impact = ref<null | Awaited<ReturnType<typeof getCustomerSustainabilityImpact>>>(null)
const recentAssets = ref<AssetSummary[]>([])
const recentShipments = ref<ShipmentListSummary[]>([])
const assetSummary = ref<{ total: number; byStatus: Record<string, number>; byLocation: Record<string, number> } | null>(null)
const route = useRoute()
const router = useRouter()
const isReadonlyPortal = computed(() => route.path.includes('/employee-portal/customers/') || Boolean(route.meta.customerPortalReadonly))

onMounted(async () => {
  if (isReadonlyPortal.value) {
    const customerIdParam = String(route.params.customerId || '')
    if (!customerIdParam) return
    const context = await getCustomerContext(customerIdParam)
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
      delivery_type: (r.delivery_type as 'PICKUP' | 'DROP_OFF' | undefined) || undefined,
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
    // Load assets and shipments for employee preview
    const customerIdParamObj = { customer_id: customerIdParam }
    const [assetsData, shipmentsData] = await Promise.all([
      getCustomerAssets({ page: 1, page_size: 10, ...customerIdParamObj }).catch(() => ({ results: [], count: 0 })),
      getCustomerShipments(customerIdParamObj).catch(() => []),
    ])
    recentAssets.value = assetsData.results
    recentShipments.value = shipmentsData.slice(0, 5)
    
    // Calculate asset summary
    const allAssets = await getCustomerAssets({ page_size: 1000, ...customerIdParamObj }).catch(() => ({ results: [], count: 0 }))
    const byStatus: Record<string, number> = {}
    const byLocation: Record<string, number> = {}
    allAssets.results.forEach(asset => {
      byStatus[asset.status] = (byStatus[asset.status] || 0) + 1
      byLocation[asset.location] = (byLocation[asset.location] || 0) + 1
    })
    assetSummary.value = {
      total: allAssets.count,
      byStatus,
      byLocation,
    }
    return
  }
  const customerIdParam = isEmployeePreview.value && customerId.value ? { customer_id: customerId.value } : {}
  const [requestsData, impactData, assetsData, shipmentsData] = await Promise.all([
    getMyIntakeRequests(),
    getCustomerSustainabilityImpact(),
    getCustomerAssets({ page: 1, page_size: 10, ...customerIdParam }).catch(() => ({ results: [], count: 0 })),
    getCustomerShipments(customerIdParam).catch(() => []),
  ])
  requests.value = requestsData
  impact.value = impactData
  recentAssets.value = assetsData.results
  recentShipments.value = shipmentsData.slice(0, 5)
  
  // Calculate asset summary
  const allAssets = await getCustomerAssets({ page_size: 1000, ...customerIdParam }).catch(() => ({ results: [], count: 0 }))
  const byStatus: Record<string, number> = {}
  const byLocation: Record<string, number> = {}
  allAssets.results.forEach(asset => {
    byStatus[asset.status] = (byStatus[asset.status] || 0) + 1
    byLocation[asset.location] = (byLocation[asset.location] || 0) + 1
  })
  assetSummary.value = {
    total: allAssets.count,
    byStatus,
    byLocation,
  }
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function prettyStatus(status: string) {
  return status.replace(/_/g, ' ')
}

function logisticsLabel(r: IntakeRequestSummary): string {
  const type = r.delivery_type || 'PICKUP'
  if (type === 'DROP_OFF') {
    if (r.drop_off_preferred_start) {
      return `Drop-off preferred: ${formatDate(r.drop_off_preferred_start)}`
    }
    return 'Drop-off'
  }
  if (r.pickup_scheduled_at) {
    return `Pickup scheduled for ${formatDate(r.pickup_scheduled_at)}`
  }
  return 'Pickup'
}

const basePath = computed(() => {
  if (isReadonlyPortal.value) {
    return `/employee-portal/customers/${String(route.params.customerId || '')}/portal`
  }
  return '/customer-portal'
})

const isEmployeePreview = computed(() => route.path.includes('/employee-portal/customers/'))
const customerId = computed(() => isEmployeePreview.value ? String(route.params.customerId || '') : null)

function openRequest(id: string) {
  router.push(`${basePath.value}/requests/${id}`)
}

function formatStatus(status: string) {
  return status.replace(/_/g, ' ')
}

// getLocationLabel is imported from api.ts

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
  // ITAD Carbon Elimination Calculation based on industry standards:
  // - Reused/Resold: Avoids new production emissions (~300 kg CO2e per kg of device)
  // - Recycled: Avoids landfill emissions (~3 kg CO2e per kg of material)
  // - Disposed: Minimal benefit but still reduces impact (~0.5 kg CO2e per kg)
  const reusedWeightKg = impact.value?.reused_weight_kg ?? 0
  const recycledWeightKg = impact.value?.recycled_weight_kg ?? 0
  const disposedWeightKg = impact.value?.disposed_weight_kg ?? 0
  
  // Carbon factors (kg CO2e per kg of material)
  const REUSED_FACTOR = 300  // High value - avoids new production
  const RECYCLED_FACTOR = 3   // Avoids landfill emissions
  const DISPOSED_FACTOR = 0.5 // Minimal but still beneficial
  
  const carbonFromReused = reusedWeightKg * REUSED_FACTOR
  const carbonFromRecycled = recycledWeightKg * RECYCLED_FACTOR
  const carbonFromDisposed = disposedWeightKg * DISPOSED_FACTOR
  
  return carbonFromReused + carbonFromRecycled + carbonFromDisposed
})

const estimatedCarbonPercent = computed(() => {
  const value = estimatedCarbonKg.value
  // Scale to 0-100% with a reasonable cap (100,000 kg CO2e = 100%)
  const cap = 100000
  return Math.max(0, Math.min(100, (value / cap) * 100))
})
</script>

