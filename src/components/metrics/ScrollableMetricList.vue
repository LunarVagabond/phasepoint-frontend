<template>
  <div class="scrollable-metric-list-wrap">
    <ul class="scrollable-metric-list">
      <li
        v-for="(item, index) in items"
        :key="keyFn(item, index)"
        class="metric-list-row"
      >
        <span class="metric-list-label">{{ item.label }}</span>
        <span class="metric-list-value">{{ item.value }}</span>
      </li>
    </ul>
    <p v-if="items.length === 0 && !loading" class="metric-list-empty">No data</p>
    <p v-if="loading" class="metric-list-loading">Loading…</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    items: Array<{ label: string; value: string | number }>
    loading?: boolean
    keyFn?: (item: { label: string; value: string | number }, index: number) => string | number
  }>(),
  {
    loading: false,
    keyFn: (_, i) => i,
  }
)
</script>

<style scoped lang="scss">
@use '../../styles/variables' as *;

.scrollable-metric-list-wrap {
  max-height: 280px;
  overflow-y: auto;
  border-radius: $radius-md;
  border: 1px solid var(--color-border);
}

.scrollable-metric-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.metric-list-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-3 $space-4;
  border-bottom: 1px solid var(--color-border);
  gap: $space-4;

  &:last-child {
    border-bottom: none;
  }
}

.metric-list-label {
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: $font-size-sm;
  color: var(--color-text);
}

.metric-list-value {
  flex-shrink: 0;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  font-size: $font-size-sm;
}

.metric-list-empty,
.metric-list-loading {
  margin: 0;
  padding: $space-4;
  color: var(--color-text-muted);
  font-size: $font-size-sm;
}
</style>
