<template>
  <div ref="rootRef" class="filterable-select">
    <button
      type="button"
      class="filterable-select-trigger"
      :class="{ open: isOpen, 'has-value': !!modelValue }"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-label="placeholder"
      @click="toggle"
    >
      <span class="trigger-label">{{ selectedLabel || placeholder }}</span>
      <span class="trigger-chevron">▼</span>
    </button>
    <div v-if="isOpen" class="filterable-select-dropdown" role="listbox">
      <input
        ref="searchRef"
        v-model="searchQuery"
        type="text"
        class="filterable-select-search"
        :placeholder="searchPlaceholder"
        autocomplete="off"
        @keydown.escape="close"
        @keydown.down.prevent="moveHighlight(1)"
        @keydown.up.prevent="moveHighlight(-1)"
        @keydown.enter.prevent="selectHighlighted"
      />
      <ul ref="listRef" class="filterable-select-list">
        <li
          v-for="(opt, idx) in filteredOptions"
          :key="opt.value"
          class="filterable-select-option"
          :class="{ highlighted: idx === highlightedIndex }"
          role="option"
          :aria-selected="modelValue === opt.value"
          @click="select(opt.value)"
          @mouseenter="highlightedIndex = idx"
        >
          {{ opt.label }}
        </li>
        <li v-if="filteredOptions.length === 0" class="filterable-select-empty">
          No matches
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

export interface FilterableOption {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: FilterableOption[]
    placeholder?: string
    searchPlaceholder?: string
  }>(),
  { placeholder: 'Select…', searchPlaceholder: 'Search…' }
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const rootRef = ref<HTMLElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLUListElement | null>(null)
const isOpen = ref(false)
const searchQuery = ref('')
const highlightedIndex = ref(0)

const selectedLabel = computed(() => {
  if (!props.modelValue) return ''
  const opt = props.options.find((o) => o.value === props.modelValue)
  return opt?.label ?? ''
})

const filteredOptions = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((o) => o.label.toLowerCase().includes(q))
})

watch(isOpen, (open) => {
  if (open) {
    searchQuery.value = ''
    highlightedIndex.value = 0
    nextTick(() => {
      searchRef.value?.focus()
    })
  }
})

function toggle() {
  if (isOpen.value) close()
  else {
    isOpen.value = true
  }
}

function close() {
  isOpen.value = false
}

function select(value: string) {
  emit('update:modelValue', value)
  close()
}

function moveHighlight(delta: number) {
  const len = filteredOptions.value.length
  if (len === 0) return
  highlightedIndex.value = (highlightedIndex.value + delta + len) % len
}

function selectHighlighted() {
  const opts = filteredOptions.value
  if (opts.length && opts[highlightedIndex.value]) {
    select(opts[highlightedIndex.value].value)
  }
}

// Click outside to close
function onDocClick(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) close()
}

watch(isOpen, (open) => {
  if (open) {
    document.addEventListener('click', onDocClick)
  } else {
    document.removeEventListener('click', onDocClick)
  }
})
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.filterable-select {
  position: relative;
  min-width: 200px;
}

.filterable-select-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding: $space-2 $space-3;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: $font-size-base;
  text-align: left;
  cursor: pointer;
}
.filterable-select-trigger:hover {
  border-color: var(--color-text-muted);
}
.filterable-select-trigger.open {
  border-color: var(--color-primary);
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}
.trigger-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.filterable-select-trigger:not(.has-value) .trigger-label {
  color: var(--color-text-muted);
}
.trigger-chevron {
  font-size: 0.65em;
  color: var(--color-text-muted);
}

.filterable-select-dropdown {
  position: absolute;
  z-index: 50;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.filterable-select-search {
  width: 100%;
  padding: $space-2 $space-3;
  border: none;
  border-bottom: 1px solid var(--color-border);
  font-size: $font-size-base;
  background: var(--color-surface);
  color: var(--color-text);
  box-sizing: border-box;
}
.filterable-select-search::placeholder {
  color: var(--color-text-muted);
}
.filterable-select-search:focus {
  outline: none;
}

.filterable-select-list {
  max-height: 220px;
  overflow-y: auto;
  margin: 0;
  padding: $space-1;
  list-style: none;
}

.filterable-select-option {
  padding: $space-2 $space-3;
  cursor: pointer;
  border-radius: $radius-sm;
  color: var(--color-text);
}
.filterable-select-option:hover,
.filterable-select-option.highlighted {
  background: var(--color-bg-subtle, rgba(0 0 0 / 0.05));
}

.filterable-select-empty {
  padding: $space-2 $space-3;
  color: var(--color-text-muted);
  font-size: $font-size-sm;
}
</style>
