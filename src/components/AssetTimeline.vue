<template>
  <div class="asset-timeline">
    <h3 v-if="title" class="timeline-title">{{ title }}</h3>
    <div class="timeline-container">
      <div
        v-for="(stage, index) in timelineStages"
        :key="stage.key"
        class="timeline-stage"
        :class="{ active: stage.active, completed: stage.completed }"
      >
        <div class="timeline-marker">
          <div class="marker-dot"></div>
          <div v-if="index < timelineStages.length - 1" class="marker-line"></div>
        </div>
        <div class="timeline-content">
          <div class="stage-header">
            <span class="stage-label">{{ stage.label }}</span>
            <span v-if="stage.duration" class="stage-duration">{{ stage.duration }}</span>
          </div>
          <div v-if="stage.timestamp" class="stage-timestamp">{{ formatTimestamp(stage.timestamp) }}</div>
          <div v-if="stage.details" class="stage-details">{{ stage.details }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface TimelineStage {
  key: string
  label: string
  active: boolean
  completed: boolean
  timestamp?: string
  duration?: string
  details?: string
}

interface Props {
  stages: Array<{
    key: string
    label: string
    timestamp?: string
    duration?: number // in days
    details?: string
  }>
  currentStage?: string
  title?: string
}

const props = defineProps<Props>()

const timelineStages = computed<TimelineStage[]>(() => {
  let foundCurrent = false
  
  return props.stages.map((stage, index) => {
    const isCurrent = stage.key === props.currentStage
    const isCompleted = foundCurrent === false && !isCurrent
    
    if (isCurrent) {
      foundCurrent = true
    }
    
    const durationText = stage.duration !== undefined
      ? `${stage.duration.toFixed(1)} days`
      : undefined
    
    return {
      key: stage.key,
      label: stage.label,
      active: isCurrent,
      completed: isCompleted,
      timestamp: stage.timestamp,
      duration: durationText,
      details: stage.details,
    }
  })
})

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;

.asset-timeline {
  padding: $space-4;
}

.timeline-title {
  margin: 0 0 $space-4;
  font-size: $font-size-lg;
  font-weight: 600;
}

.timeline-container {
  position: relative;
  padding-left: $space-6;
}

.timeline-stage {
  position: relative;
  margin-bottom: $space-5;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.timeline-marker {
  position: absolute;
  left: -$space-6;
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.marker-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-border);
  border: 2px solid var(--color-surface);
  z-index: 1;
  transition: all 0.2s ease;
}

.timeline-stage.completed .marker-dot {
  background: #10b981;
  border-color: #10b981;
}

.timeline-stage.active .marker-dot {
  background: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb, 37, 99, 235), 0.2);
}

.marker-line {
  width: 2px;
  flex: 1;
  min-height: $space-5;
  background: var(--color-border);
  margin-top: 4px;
}

.timeline-stage.completed .marker-line {
  background: #10b981;
}

.timeline-content {
  padding-left: $space-4;
}

.stage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-1;
}

.stage-label {
  font-weight: 600;
  color: var(--color-text);
  font-size: $font-size-base;
}

.timeline-stage.completed .stage-label {
  color: var(--color-text-muted);
}

.timeline-stage.active .stage-label {
  color: var(--color-primary);
}

.stage-duration {
  font-size: $font-size-sm;
  color: var(--color-text-muted);
  font-weight: 500;
}

.stage-timestamp {
  font-size: $font-size-sm;
  color: var(--color-text-muted);
  margin-bottom: $space-1;
}

.stage-details {
  font-size: $font-size-sm;
  color: var(--color-text-muted);
  margin-top: $space-1;
}
</style>
