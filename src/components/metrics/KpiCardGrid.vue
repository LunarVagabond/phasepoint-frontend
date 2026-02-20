<template>
  <div class="kpi-card-grid">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="kpi-card"
    >
      <p class="kpi-card-label">{{ item.label }}</p>
      <p class="kpi-card-value">{{ item.value }}</p>
      <p v-if="item.sublabel" class="kpi-card-sublabel">{{ item.sublabel }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  items: Array<{ label: string; value: string | number; sublabel?: string }>
}>()
</script>

<style scoped lang="scss">
@use '../../styles/variables' as *;

.kpi-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: $space-4;
}

.kpi-card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  padding: $space-4;
  text-align: center;
}

.kpi-card-label {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  color: var(--color-text-muted);
  font-weight: 500;
}

.kpi-card-value {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1.2;
}

.kpi-card-sublabel {
  margin: $space-2 0 0;
  font-size: $font-size-xs;
  color: var(--color-text-muted);
}
</style>
