<template>
  <div class="metric-table-wrap">
    <table class="metric-table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
          <th v-if="linkColumn" class="metric-table-link-col"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in data"
          :key="rowKey(row, index)"
          :class="{ clickable: linkColumn && getLink(row) }"
          @click="linkColumn && getLink(row) ? $emit('row-click', row) : undefined"
        >
          <td v-for="col in columns" :key="col.key">
            <span v-if="col.type === 'strong'" class="metric-table-strong">{{ getCell(row, col.key) }}</span>
            <span v-else>{{ getCell(row, col.key) }}</span>
          </td>
          <td v-if="linkColumn" class="metric-table-link-col">
            <router-link
              v-if="getLink(row)"
              :to="getLink(row)!"
              class="metric-table-link"
              @click.stop
            >
              {{ linkColumn.label }}
            </router-link>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="!loading && data.length === 0" class="metric-table-empty">No data</p>
    <p v-if="loading" class="metric-table-loading">Loading…</p>
  </div>
</template>

<script setup lang="ts">
interface Column {
  key: string
  label: string
  type?: 'strong' | 'badge'
}

const props = withDefaults(
  defineProps<{
    columns: Column[]
    data: Record<string, unknown>[]
    rowKey?: (row: Record<string, unknown>, index: number) => string | number
    linkColumn?: { key: string; label: string; to: (row: Record<string, unknown>) => string }
    loading?: boolean
  }>(),
  {
    loading: false,
    rowKey: (_, index) => index,
  }
)

const emit = defineEmits<{
  'row-click': [row: Record<string, unknown>]
}>()

function getCell(row: Record<string, unknown>, key: string): string | number {
  const v = row[key]
  if (v === null || v === undefined) return '—'
  return String(v)
}

function getLink(row: Record<string, unknown>): string | undefined {
  if (!props.linkColumn) return undefined
  return props.linkColumn.to(row)
}
</script>

<style scoped lang="scss">
@use '../../styles/variables' as *;

.metric-table-wrap {
  overflow-x: auto;
}

.metric-table {
  width: 100%;
  border-collapse: collapse;
  font-size: $font-size-sm;

  th,
  td {
    padding: $space-2 $space-4;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
  }

  th {
    font-weight: 600;
    color: var(--color-text-muted);
  }

  td {
    color: var(--color-text);
  }

  tr.clickable {
    cursor: pointer;
  }

  tr.clickable:hover {
    background: var(--color-row-hover);
  }
}

.metric-table-strong {
  font-weight: 600;
  color: var(--color-text);
}

.metric-table-link-col {
  width: 1%;
  white-space: nowrap;
}

.metric-table-link {
  color: var(--color-primary);
  text-decoration: none;
  font-size: $font-size-sm;

  &:hover {
    text-decoration: underline;
  }
}

.metric-table-empty,
.metric-table-loading {
  margin: $space-4 0 0;
  padding: $space-2;
  color: var(--color-text-muted);
  font-size: $font-size-sm;
}
</style>
