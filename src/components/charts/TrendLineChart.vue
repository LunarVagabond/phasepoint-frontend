<template>
  <div class="chart-container">
    <canvas v-if="chartLoaded" ref="chartCanvas"></canvas>
    <div v-else class="chart-error">
      <p>Chart unavailable. Please ensure Chart.js is installed.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'

let Chart: any = null
let CategoryScale: any = null
let LinearScale: any = null
let PointElement: any = null
let LineElement: any = null
let LineController: any = null
let Tooltip: any = null
let Legend: any = null

async function loadChartJS() {
  try {
    const chartModule = await import('chart.js')
    Chart = chartModule.Chart
    CategoryScale = chartModule.CategoryScale
    LinearScale = chartModule.LinearScale
    PointElement = chartModule.PointElement
    LineElement = chartModule.LineElement
    LineController = chartModule.LineController
    Tooltip = chartModule.Tooltip
    Legend = chartModule.Legend
    
    if (Chart && CategoryScale && LinearScale && PointElement && LineElement && LineController && Tooltip && Legend) {
      Chart.register(CategoryScale, LinearScale, PointElement, LineElement, LineController, Tooltip, Legend)
      return true
    }
    return false
  } catch (error) {
    console.error('Failed to load Chart.js:', error)
    return false
  }
}

interface Props {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
  }>
  yAxisLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  yAxisLabel: 'Count',
})

const chartCanvas = ref<HTMLCanvasElement | null>(null)
const chartLoaded = ref(false)
let chartInstance: any = null

function createChart() {
  if (!chartCanvas.value || !Chart) return

  const config = {
    type: 'line',
    data: {
      labels: props.labels,
      datasets: props.datasets.map((ds) => ({
        ...ds,
        borderColor: ds.borderColor || '#3b82f6',
        backgroundColor: ds.backgroundColor || 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: props.yAxisLabel,
          },
        },
        x: {
          title: {
            display: true,
            text: 'Date',
          },
        },
      },
    },
  }

  if (chartInstance) {
    chartInstance.destroy()
  }
  chartInstance = new Chart(chartCanvas.value, config)
}

watch(
  () => [props.labels, props.datasets],
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
    if (chartCanvas.value) {
      createChart()
    } else {
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
  height: 300px;
  width: 100%;
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
