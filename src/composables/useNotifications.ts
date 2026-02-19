import { ref } from 'vue'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  duration?: number // Auto-dismiss after milliseconds (0 = no auto-dismiss)
}

const notifications = ref<Notification[]>([])

export function useNotifications() {
  function showNotification(
    message: string,
    type: NotificationType = 'info',
    duration: number = 5000
  ) {
    const id = `${Date.now()}-${Math.random()}`
    const notification: Notification = {
      id,
      type,
      message,
      duration: duration > 0 ? duration : undefined,
    }
    
    notifications.value.push(notification)
    
    // Auto-dismiss if duration is set
    if (duration > 0) {
      setTimeout(() => {
        dismissNotification(id)
      }, duration)
    }
    
    return id
  }
  
  function dismissNotification(id: string) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }
  
  function clearAll() {
    notifications.value = []
  }
  
  // Convenience methods
  function success(message: string, duration?: number) {
    return showNotification(message, 'success', duration)
  }
  
  function error(message: string, duration?: number) {
    return showNotification(message, 'error', duration || 8000) // Errors stay longer
  }
  
  function warning(message: string, duration?: number) {
    return showNotification(message, 'warning', duration)
  }
  
  function info(message: string, duration?: number) {
    return showNotification(message, 'info', duration)
  }
  
  return {
    notifications,
    showNotification,
    dismissNotification,
    clearAll,
    success,
    error,
    warning,
    info,
  }
}
