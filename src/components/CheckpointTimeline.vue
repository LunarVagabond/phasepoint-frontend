<template>
  <div class="checkpoint-timeline">
    <h3 v-if="title" class="timeline-title">{{ title }}</h3>
    <div class="timeline-container">
      <div
        v-for="(checkpoint, index) in checkpoints"
        :key="index"
        class="checkpoint-item"
        :class="{ 'checkpoint-completed': checkpoint.completed, 'checkpoint-current': checkpoint.current }"
      >
        <div class="checkpoint-marker">
          <div v-if="checkpoint.completed" class="checkpoint-icon">✓</div>
          <div v-else-if="checkpoint.current" class="checkpoint-icon current">●</div>
          <div v-else class="checkpoint-icon pending">○</div>
        </div>
        <div class="checkpoint-content">
          <div class="checkpoint-label">{{ checkpoint.label }}</div>
          <div v-if="checkpoint.description" class="checkpoint-description">{{ checkpoint.description }}</div>
          <div v-if="checkpoint.timestamp" class="checkpoint-timestamp">{{ formatDate(checkpoint.timestamp) }}</div>
          <div v-if="checkpoint.user" class="checkpoint-user">by {{ checkpoint.user }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface Checkpoint {
  label: string
  description?: string
  timestamp?: string
  user?: string
  completed?: boolean
  current?: boolean
}

const props = defineProps<{
  checkpoints: Checkpoint[]
  title?: string
}>()

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}
</script>
