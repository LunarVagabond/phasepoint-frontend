/**
 * Global test setup for Vitest.
 * Provides Pinia and global mocks for Vue component tests.
 */
import { vi, beforeEach } from 'vitest'
import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Fresh Pinia for each test so store state is isolated
beforeEach(() => {
  const pinia = createPinia()
  setActivePinia(pinia)
  config.global.plugins = [pinia]
})

// Mock fetch globally by default so API calls don't hit the network
vi.stubGlobal('fetch', vi.fn())

// Optional: mock window.matchMedia for useTheme (prefers-color-scheme)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
