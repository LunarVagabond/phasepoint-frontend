import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useNotifications } from '../useNotifications'
import { nextTickAndFlush } from '@/test-utils/helpers'

describe('useNotifications', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useNotifications().clearAll()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('showNotification adds a notification', () => {
    const { notifications, showNotification } = useNotifications()
    expect(notifications.value).toHaveLength(0)
    const id = showNotification('Hello', 'info', 0)
    expect(notifications.value).toHaveLength(1)
    expect(notifications.value[0].message).toBe('Hello')
    expect(notifications.value[0].type).toBe('info')
    expect(notifications.value[0].id).toBe(id)
  })

  it('dismissNotification removes the notification', () => {
    const { notifications, showNotification, dismissNotification } = useNotifications()
    const id = showNotification('Hi', 'info', 0)
    expect(notifications.value).toHaveLength(1)
    dismissNotification(id)
    expect(notifications.value).toHaveLength(0)
  })

  it('clearAll removes all notifications', () => {
    const { notifications, showNotification, clearAll } = useNotifications()
    showNotification('A', 'info', 0)
    showNotification('B', 'info', 0)
    expect(notifications.value).toHaveLength(2)
    clearAll()
    expect(notifications.value).toHaveLength(0)
  })

  it('auto-dismisses after duration', async () => {
    const { notifications, showNotification } = useNotifications()
    showNotification('Bye', 'success', 1000)
    expect(notifications.value).toHaveLength(1)
    vi.advanceTimersByTime(1000)
    await nextTickAndFlush()
    expect(notifications.value).toHaveLength(0)
  })

  it('success/error/warning/info convenience methods', () => {
    const { notifications, success, error, warning, info } = useNotifications()
    success('OK')
    error('Fail')
    warning('Careful')
    info('Note')
    const types = notifications.value.map((n) => n.type)
    const messages = notifications.value.map((n) => n.message)
    expect(types).toContain('success')
    expect(types).toContain('error')
    expect(types).toContain('warning')
    expect(types).toContain('info')
    expect(messages).toContain('OK')
    expect(messages).toContain('Fail')
    expect(messages).toContain('Careful')
    expect(messages).toContain('Note')
  })
})
