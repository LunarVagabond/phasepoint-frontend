<template>
  <div class="notification-container" v-if="notifications.length > 0">
    <TransitionGroup name="notification" tag="div" class="notification-list">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification', `notification--${notification.type}`]"
        role="alert"
      >
        <div class="notification-content">
          <span class="notification-icon">
            <svg v-if="notification.type === 'success'" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" stroke-width="2"/>
              <path d="M6 10l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else-if="notification.type === 'error'" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/>
              <path d="M10 6v4M10 14h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <svg v-else-if="notification.type === 'warning'" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L2 18h16L10 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M10 8v4M10 14h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/>
              <path d="M10 6v4M10 14h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </span>
          <span class="notification-message">{{ notification.message }}</span>
        </div>
        <button
          class="notification-close"
          @click="dismissNotification(notification.id)"
          aria-label="Dismiss notification"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useNotifications } from '../composables/useNotifications'

const { notifications, dismissNotification } = useNotifications()
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  pointer-events: none;
  max-width: 400px;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.notification {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  min-width: 300px;
  max-width: 100%;
  
  &--success {
    border-left: 4px solid var(--color-success, #10b981);
    .notification-icon {
      color: var(--color-success, #10b981);
    }
  }
  
  &--error {
    border-left: 4px solid var(--color-error, #ef4444);
    .notification-icon {
      color: var(--color-error, #ef4444);
    }
  }
  
  &--warning {
    border-left: 4px solid var(--color-warning, #f59e0b);
    .notification-icon {
      color: var(--color-warning, #f59e0b);
    }
  }
  
  &--info {
    border-left: 4px solid var(--color-primary, #3b82f6);
    .notification-icon {
      color: var(--color-primary, #3b82f6);
    }
  }
}

.notification-content {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  flex: 1;
  min-width: 0;
}

.notification-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.notification-message {
  flex: 1;
  font-size: $font-size-sm;
  line-height: 1.5;
  color: var(--color-text);
  word-wrap: break-word;
}

.notification-close {
  flex-shrink: 0;
  background: none;
  border: none;
  padding: $space-1;
  cursor: pointer;
  color: var(--color-text-muted);
  opacity: 0.7;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    opacity: 1;
  }
  
  &:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-radius: $radius-sm;
  }
}

// Transition animations
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}

@media (max-width: 768px) {
  .notification-container {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
  
  .notification {
    min-width: auto;
  }
}
</style>
