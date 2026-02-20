<template>
  <div class="donut-metric">
    <StatusDistributionChart v-if="Object.keys(data).length > 0" :data="data" :colors="colors" />
    <p v-else class="donut-empty">No data available</p>
  </div>
</template>

<script setup lang="ts">
import StatusDistributionChart from '../charts/StatusDistributionChart.vue'

defineProps<{
  data: Record<string, number>
  colors?: Record<string, string>
}>()
</script>

<style scoped lang="scss">
@use '../../styles/variables' as *;

.donut-metric {
  min-height: 200px;
}

.donut-empty {
  margin: 0;
  padding: $space-6;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}
</style>
