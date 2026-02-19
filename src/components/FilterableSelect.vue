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
      <ul class="filterable-select-list">
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
@use '../styles/components/filterable-select';
</style>
