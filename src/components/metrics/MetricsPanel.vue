<template>
  <article class="metrics-panel">
    <header class="metrics-panel-header">
      <h3 class="metrics-panel-title">{{ title }}</h3>
      <div v-if="$slots.actions" class="metrics-panel-actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="metrics-panel-body">
      <slot />
    </div>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<style scoped lang="scss">
@use '../../styles/variables' as *;

.metrics-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: $radius-lg;
  padding: $space-6;
}

.metrics-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-4;
}

.metrics-panel-title {
  margin: 0;
  font-size: $font-size-lg;
  font-weight: 600;
  color: var(--color-text);
}

.metrics-panel-actions {
  flex-shrink: 0;
}

.metrics-panel-body {
  min-height: 0;
}
</style>
