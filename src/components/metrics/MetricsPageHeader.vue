<template>
  <header class="metrics-page-header">
    <div class="metrics-header-content">
      <h1 class="metrics-title">{{ title }}</h1>
      <p v-if="subtitle" class="metrics-subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="metrics-header-actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<style scoped lang="scss">
@use '../../styles/variables' as *;

.metrics-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: $space-4;
  margin-bottom: $space-6;
}

.metrics-header-content {
  flex: 1;
  min-width: 0;
}

.metrics-title {
  margin: 0 0 $space-2;
  font-size: $font-size-2xl;
  font-weight: 600;
  color: var(--color-text);
}

.metrics-subtitle {
  margin: 0;
  font-size: $font-size-sm;
  color: var(--color-text-muted);
}

.metrics-header-actions {
  flex-shrink: 0;
}
</style>
