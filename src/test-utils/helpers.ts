/**
 * Common test utilities: render helpers, wait utilities.
 */
import { vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'

/** Wait for next tick and flush all pending promises */
export async function nextTickAndFlush() {
  await flushPromises()
}

/** Wait a short delay (for timeouts / debounce in tests) */
export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Create a mock router with push/replace */
export function createMockRouter() {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    currentRoute: { value: { path: '/', params: {}, query: {} } },
  }
}
