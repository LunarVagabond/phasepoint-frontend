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
  } catch (error) {
    console.error('Failed to load Chart.js:', error)
    return false
  }
}

interface Props {
  data: Record<string, number>
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: '#3b82f6',
})

const chartCanvas = ref<HTMLCanvasElement | null>(null)
const chartLoaded = ref(false)
let chartInstance: any = null

function createChart() {
  if (!chartCanvas.value || !Chart) return

  const labels = Object.keys(props.data)
  const values = Object.values(props.data)

  const config = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Count',
          data: values,
          backgroundColor: props.color,
          borderColor: props.color,
          borderWidth: 1,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context: { parsed?: { x?: number; y?: number }; label?: string }) => {
              const value = context.parsed?.x ?? context.parsed?.y ?? 0
              const label = context.label || ''
              return `${label}: ${value}`
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
        y: {
          ticks: {
            autoSkip: false,
            maxRotation: 0,
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
  min-height: 280px;
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
