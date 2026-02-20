<template>
  <div class="system-metrics-page">
    <MetricsPageHeader
      title="System Metrics"
      subtitle="Organization-wide operations, employee performance, customer metrics, and compliance."
    >
      <template #actions>
        <router-link v-if="store.kpis?.open_alerts != null && store.kpis.open_alerts > 0" to="/employee-portal/workflow-alerts" class="alerts-link">
          Open Alerts: {{ store.kpis.open_alerts }}
        </router-link>
      </template>
    </MetricsPageHeader>

    <MetricsFilterBar
      :filters="store.filters"
      :customer-options="customerOptions"
      :employee-options="employeeOptions"
      @update:filters="(p) => { store.setFilters(p); store.fetchMetrics(true) }"
      @refresh="store.fetchMetrics(true)"
      @clear="() => { store.clearFilters(); store.fetchMetrics(true) }"
    />

    <div v-if="store.loading" class="loading-state">Loading metrics…</div>
    <div v-else-if="store.error" class="error-state">{{ store.error }}</div>
    <div v-else class="metrics-content">
      <section class="metrics-section">
        <KpiCardGrid :items="kpiItems" />
      </section>

      <section class="metrics-section metrics-grid-two">
        <MetricsPanel title="Assets by Stage">
          <DonutMetric :data="assetsByStageData" />
        </MetricsPanel>
        <MetricsPanel title="Throughput Trends">
          <div v-if="throughputLabels.length > 0" class="chart-wrap">
            <TrendLineChart
              :labels="throughputLabels"
              :datasets="throughputDatasets"
              y-axis-label="Assets"
            />
          </div>
          <p v-else class="empty-message">No throughput data for the selected range.</p>
        </MetricsPanel>
      </section>

      <section class="metrics-section metrics-grid-two">
        <MetricsPanel title="Work Order Completion">
          <div class="completion-value">{{ store.operations?.work_order_completion_rate ?? 0 }}%</div>
          <p class="completion-desc">Work orders completed in the selected period</p>
        </MetricsPanel>
        <MetricsPanel title="Compliance & Quality">
          <div class="compliance-row">
            <span class="compliance-label">Sanitization pass rate</span>
            <span class="compliance-value">{{ store.compliance?.sanitization_pass_rate ?? 0 }}%</span>
          </div>
          <div class="compliance-row">
            <span class="compliance-label">Certificates generated</span>
            <span class="compliance-value">{{ store.compliance?.certificates_generated ?? 0 }}</span>
          </div>
          <div class="compliance-row">
            <span class="compliance-label">Audit completeness</span>
            <span class="compliance-value">{{ store.compliance?.audit_completeness ?? 0 }}%</span>
          </div>
        </MetricsPanel>
      </section>

      <section v-if="store.alerts != null" class="metrics-section">
        <MetricsPanel title="Alert metrics (selected period)">
          <p class="alerts-desc">Track whether the team is improving or losing efficiency on workflow alerts.</p>
          <div class="alerts-metrics-grid">
            <div class="alerts-metric">
              <span class="alerts-metric-label">Opened in period</span>
              <span class="alerts-metric-value">{{ store.alerts.opened_in_period ?? '—' }}</span>
            </div>
            <div class="alerts-metric">
              <span class="alerts-metric-label">Closed in period</span>
              <span class="alerts-metric-value">{{ store.alerts.closed_in_period ?? '—' }}</span>
            </div>
            <div class="alerts-metric">
              <span class="alerts-metric-label">Avg time to close</span>
              <span class="alerts-metric-value">{{ store.alerts.avg_hours_to_close != null ? `${store.alerts.avg_hours_to_close}h` : '—' }}</span>
            </div>
          </div>
          <router-link to="/employee-portal/workflow-alerts" class="alerts-panel-link">View open alerts</router-link>
        </MetricsPanel>
      </section>

      <section class="metrics-section">
        <MetricsPanel title="Employee Performance">
          <BarChartMetric
            :labels="employeeLabels"
            :values="employeeValues"
            label="Assets processed"
            horizontal
          />
          <div v-if="store.employees.length > 0" class="metric-table-wrap">
            <MetricTable
              :columns="employeeColumns"
              :data="store.employees"
              :row-key="(row, _i) => (row as { username: string }).username"
            />
          </div>
        </MetricsPanel>
      </section>

      <section class="metrics-section">
        <MetricsPanel title="Volume by Customer">
          <BarChartMetric
            :labels="customerLabels"
            :values="customerValues"
            label="Assets"
            horizontal
          />
          <ScrollableMetricList
            :items="customerListItems"
            :key-fn="(item, i) => item.label + i"
          />
        </MetricsPanel>
      </section>

      <section class="metrics-section">
        <MetricsPanel title="Trends (Daily)">
          <div v-if="store.trends.daily.length > 0" class="chart-wrap">
            <TrendLineChart
              :labels="trendDailyLabels"
              :datasets="trendDailyDatasets"
              y-axis-label="Assets"
            />
          </div>
          <p v-else class="empty-message">No daily trend data.</p>
        </MetricsPanel>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSystemMetricsStore } from '../stores/systemMetrics'
import MetricsPageHeader from '../components/metrics/MetricsPageHeader.vue'
import MetricsFilterBar from '../components/metrics/MetricsFilterBar.vue'
import KpiCardGrid from '../components/metrics/KpiCardGrid.vue'
import MetricsPanel from '../components/metrics/MetricsPanel.vue'
import BarChartMetric from '../components/metrics/BarChartMetric.vue'
import DonutMetric from '../components/metrics/DonutMetric.vue'
import MetricTable from '../components/metrics/MetricTable.vue'
import ScrollableMetricList from '../components/metrics/ScrollableMetricList.vue'
import TrendLineChart from '../components/charts/TrendLineChart.vue'

const store = useSystemMetricsStore()

const customerOptions = computed(() => [])
const employeeOptions = computed(() => [])

const kpiItems = computed(() => {
  const k = store.kpis
  if (!k) return []
  return [
    { label: 'Assets Processed', value: k.total_assets_processed },
    { label: 'Active Work Orders', value: k.active_work_orders },
    { label: 'Open Alerts', value: k.open_alerts },
    {
      label: 'Avg Turnaround',
      value: k.avg_turnaround_days != null ? `${k.avg_turnaround_days} days` : '—',
    },
    { label: 'Employees', value: k.employee_count },
    { label: 'Customers', value: k.customer_count },
  ]
})

const assetsByStageData = computed(() => {
  const list = store.operations?.assets_by_stage ?? []
  const out: Record<string, number> = {}
  list.forEach((r) => {
    out[r.location] = r.count
  })
  return out
})

const throughputLabels = computed(() => store.operations?.throughput_trends?.map((t) => t.date) ?? [])
const throughputDatasets = computed(() => {
  const data = store.operations?.throughput_trends?.map((t) => t.count) ?? []
  return [
    {
      label: 'Assets processed',
      data,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
  ]
})

const employeeColumns = [
  { key: 'username', label: 'Employee', type: 'strong' as const },
  { key: 'assets_processed', label: 'Assets processed' },
  { key: 'work_orders_completed', label: 'Work orders completed' },
  { key: 'avg_turnaround_days', label: 'Avg turnaround (days)' },
  { key: 'activity_count', label: 'Activity count' },
]
const employeeLabels = computed(() => store.employees.map((e) => e.username))
const employeeValues = computed(() => store.employees.map((e) => e.assets_processed))

const customerLabels = computed(() => store.customers.map((c) => c.customer_name))
const customerValues = computed(() => store.customers.map((c) => c.asset_count))
const customerListItems = computed(() =>
  store.customers.map((c) => ({ label: c.customer_name, value: c.asset_count }))
)

const trendDailyLabels = computed(() => store.trends.daily.map((d) => d.date))
const trendDailyDatasets = computed(() => {
  const data = store.trends.daily.map((d) => d.metrics?.assets_processed ?? 0)
  return [
    {
      label: 'Assets processed',
      data,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
  ]
})

onMounted(() => {
  store.fetchMetrics()
})
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.system-metrics-page {
  padding: $space-6;
  max-width: 1400px;
  margin: 0 auto;
}

.loading-state,
.error-state {
  padding: $space-6;
  text-align: center;
  color: var(--color-text-muted);
}

.error-state {
  color: var(--color-error);
}

.metrics-content {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.metrics-section {
  width: 100%;
}

.metrics-grid-two {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: $space-6;
}

.chart-wrap {
  min-height: 260px;
}

.empty-message {
  margin: 0;
  padding: $space-4;
  color: var(--color-text-muted);
  font-size: $font-size-sm;
}

.completion-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
}

.completion-desc {
  margin: $space-2 0 0;
  font-size: $font-size-sm;
  color: var(--color-text-muted);
}

.compliance-row {
  display: flex;
  justify-content: space-between;
  padding: $space-2 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }
}

.compliance-label {
  color: var(--color-text-muted);
  font-size: $font-size-sm;
}

.compliance-value {
  font-weight: 600;
  color: var(--color-text);
}

.alerts-desc {
  margin: 0 0 $space-4;
  font-size: $font-size-sm;
  color: var(--color-text-muted);
}

.alerts-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-4;
  margin-bottom: $space-4;
}

.alerts-metric {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.alerts-metric-label {
  font-size: $font-size-sm;
  color: var(--color-text-muted);
}

.alerts-metric-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
}

.alerts-panel-link {
  font-size: $font-size-sm;
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    opacity: 0.8;
  }
}

.metric-table-wrap {
  margin-top: $space-4;
}

.alerts-link {
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
  font-size: $font-size-sm;

  &:hover {
    opacity: 0.8;
  }
}
</style>
