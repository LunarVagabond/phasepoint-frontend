<template>
  <div class="bar-chart-metric">
    <canvas v-if="chartLoaded" ref="chartCanvas"></canvas>
    <p v-else-if="chartError" class="chart-error">{{ chartError }}</p>
    <p v-else class="chart-loading">Loading chart…</p>
    <p v-if="chartLoaded && labels.length === 0" class="chart-empty">No data available</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'

let Chart: any = null
let CategoryScale: any = null
let LinearScale: any = null
let BarElement: any = null
let BarController: any = null
let Tooltip: any = null
let Legend: any = null

async function loadChartJS() {
  try {
    const chartModule = await import('chart.js')
    Chart = chartModule.Chart
    CategoryScale = chartModule.CategoryScale
    LinearScale = chartModule.LinearScale
    BarElement = chartModule.BarElement
    BarController = chartModule.BarController
    Tooltip = chartModule.Tooltip
    Legend = chartModule.Legend
    if (Chart && CategoryScale && LinearScale && BarElement && BarController && Tooltip && Legend) {
      Chart.register(CategoryScale, LinearScale, BarElement, BarController, Tooltip, Legend)
      return true
    }
    return false
  } catch (e) {
    console.error('BarChartMetric: Chart.js load failed', e)
    return false
  }
}

const props = withDefaults(
  defineProps<{
    labels: string[]
    values: number[]
    label?: string
    horizontal?: boolean
    color?: string
  }>(),
  {
    label: 'Count',
    horizontal: true,
    color: '#3b82f6',
  }
)

const chartCanvas = ref<HTMLCanvasElement | null>(null)
const chartLoaded = ref(false)
const chartError = ref('')
let chartInstance: any = null

function createChart() {
  if (!chartCanvas.value || !Chart || props.labels.length === 0) return
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
  const config = {
    type: 'bar',
    data: {
      labels: props.labels,
      datasets: [
        {
          label: props.label,
          data: props.values,
          backgroundColor: props.color,
          borderColor: props.color,
          borderWidth: 1,
        },
      ],
    },
    options: {
      indexAxis: props.horizontal ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const v = context.parsed.x ?? context.parsed.y ?? 0
              return `${context.label}: ${v}`
            },
          },
        },
      },
      scales: {
        x: { beginAtZero: true },
        y: { beginAtZero: true },
      },
    },
  }
  chartInstance = new Chart(chartCanvas.value, config)
}

async function init() {
  const ok = await loadChartJS()
  if (!ok) {
    chartError.value = 'Chart failed to load'
    return
  }
  chartLoaded.value = true
  await nextTick()
  createChart()
}

onMounted(() => init())
watch(
  () => [props.labels, props.values],
  () => {
    if (chartLoaded.value) nextTick(() => createChart())
  },
  { deep: true }
)
onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
})
</script>

<style scoped lang="scss">
.bar-chart-metric {
  min-height: 220px;
  position: relative;
}

.chart-error,
.chart-loading,
.chart-empty {
  margin: 0;
  padding: 1rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}
</style>
