<template>
  <div class="chart-container">
    <canvas v-if="chartLoaded" ref="chartCanvas"></canvas>
    <div v-else-if="!chartLoaded && chartError" class="chart-error">
      <p>Chart unavailable: {{ chartError }}</p>
    </div>
    <div v-else class="chart-error">
      <p>Loading chart...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'

let Chart: any = null
let ArcElement: any = null
let DoughnutController: any = null
let Tooltip: any = null
let Legend: any = null

// Lazy load Chart.js to avoid blocking initial load
async function loadChartJS() {
  try {
    const chartModule = await import('chart.js')
    Chart = chartModule.Chart
    ArcElement = chartModule.ArcElement
    DoughnutController = chartModule.DoughnutController
    Tooltip = chartModule.Tooltip
    Legend = chartModule.Legend
    
    if (!Chart || !ArcElement || !DoughnutController || !Tooltip || !Legend) {
      chartError.value = 'Chart.js modules not loaded correctly'
      return false
    }
    
    Chart.register(ArcElement, DoughnutController, Tooltip, Legend)
    return true
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    chartError.value = `Failed to load Chart.js: ${errorMsg}`
    console.error('Failed to load Chart.js:', error)
    return false
  }
}

interface Props {
  data: Record<string, number>
  colors?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  colors: () => ({
    RECEIVED: '#94a3b8',
    PENDING_SANITIZATION: '#f59e0b',
    SANITIZED_PASS: '#10b981',
    SANITIZED_FAIL: '#ef4444',
    DESTROYED: '#6366f1',
    RELEASED: '#3b82f6',
    INTAKE: '#64748b',
    DIRTY_CAGE: '#f59e0b',
    WIPE_STATION: '#eab308',
    CLEAN_CAGE: '#22c55e',
    SHIPMENT_STAGING_AREA: '#3b82f6',
    DESTRUCTION: '#a855f7',
    SHIPPED: '#06b6d4',
  }),
})

const DEFAULT_COLORS: Record<string, string> = {
  RECEIVED: '#94a3b8',
  PENDING_SANITIZATION: '#f59e0b',
  SANITIZED_PASS: '#10b981',
  SANITIZED_FAIL: '#ef4444',
  DESTROYED: '#6366f1',
  RELEASED: '#3b82f6',
  INTAKE: '#64748b',
  DIRTY_CAGE: '#f59e0b',
  WIPE_STATION: '#eab308',
  CLEAN_CAGE: '#22c55e',
  SHIPMENT_STAGING_AREA: '#3b82f6',
  DESTRUCTION: '#a855f7',
  SHIPPED: '#06b6d4',
}
const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#8b5cf6',
]

const chartCanvas = ref<HTMLCanvasElement | null>(null)
const chartLoaded = ref(false)
const chartError = ref('')
let chartInstance: any = null

function formatLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

function createChart() {
  if (!chartCanvas.value || !Chart) {
    if (!chartCanvas.value) {
      console.warn('StatusDistributionChart: Canvas element not found')
    }
    if (!Chart) {
      console.warn('StatusDistributionChart: Chart.js not loaded')
    }
    return
  }

  const labels = Object.keys(props.data).map(formatLabel)
  const values = Object.values(props.data)
  
  if (labels.length === 0 || values.length === 0) {
    console.warn('StatusDistributionChart: No data to display', props.data)
    return
  }
  
  const dataKeys = Object.keys(props.data)
  const backgroundColors = labels.map((label, index) => {
    const key = dataKeys[index]
    const explicit = key != null ? props.colors[key] : undefined
    if (explicit) return explicit
    const fromDefaults = key != null ? DEFAULT_COLORS[key] : undefined
    if (fromDefaults) return fromDefaults
    return PALETTE[index % PALETTE.length]
  })

  const config = {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: backgroundColors,
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 12,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || ''
              const value = context.parsed || 0
              const total = values.reduce((a, b) => a + b, 0)
              const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
              return `${label}: ${value} (${percent}%)`
            },
          },
        },
      },
    },
  }

  if (chartInstance) {
    chartInstance.destroy()
  }
  
  try {
    chartInstance = new Chart(chartCanvas.value, config)
  } catch (err) {
    chartError.value = `Failed to create chart: ${err instanceof Error ? err.message : 'Unknown error'}`
    console.error('Failed to create chart:', err)
  }
}

watch(
  () => props.data,
  () => {
    if (Chart && chartLoaded.value) {
      createChart()
    }
  },
  { deep: true }
)

onMounted(async () => {
  const loaded = await loadChartJS()
  if (loaded && Chart) {
    chartLoaded.value = true
    await nextTick()
    // Double check canvas exists before creating chart
    if (chartCanvas.value) {
      createChart()
    } else {
      // Retry after a short delay if canvas isn't ready
      setTimeout(() => {
        if (chartCanvas.value) {
          createChart()
        }
      }, 100)
    }
  }
})

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
})
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 250px;
  max-width: 100%;
  margin: 0 auto;
}

.chart-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}
</style>
