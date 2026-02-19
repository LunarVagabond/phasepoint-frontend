import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getTheme, setThemeOnDocument, useTheme } from '../useTheme'

describe('getTheme', () => {
  it('returns stored theme when localStorage has light or dark', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => (key === 'theme' ? 'dark' : null)),
    })
    expect(getTheme()).toBe('dark')
    vi.mocked(localStorage.getItem).mockReturnValue('light')
    expect(getTheme()).toBe('light')
  })

  it('returns dark when prefers-color-scheme: dark matches', () => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => null) })
    vi.stubGlobal('window', {
      matchMedia: vi.fn((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
      })),
    })
    expect(getTheme()).toBe('dark')
  })

  it('returns light when prefers-color-scheme is not dark', () => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => null) })
    vi.stubGlobal('window', {
      matchMedia: vi.fn(() => ({ matches: false })),
    })
    expect(getTheme()).toBe('light')
  })
})

describe('setThemeOnDocument', () => {
  it('sets data-theme attribute and localStorage', () => {
    const setAttribute = vi.fn()
    const setItem = vi.fn()
    vi.stubGlobal('document', { documentElement: { setAttribute } })
    vi.stubGlobal('localStorage', { setItem })
    setThemeOnDocument('dark')
    expect(setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
    expect(setItem).toHaveBeenCalledWith('theme', 'dark')
  })
})

describe('useTheme', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'light'),
      setItem: vi.fn(),
    })
    vi.stubGlobal('document', { documentElement: { setAttribute: vi.fn() } })
  })

  it('returns initial theme from getTheme', () => {
    const { theme } = useTheme()
    expect(theme.value).toBe('light')
  })

  it('setTheme updates theme and document', () => {
    const setAttribute = vi.fn()
    vi.stubGlobal('document', { documentElement: { setAttribute } })
    const setItem = vi.fn()
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'light'), setItem })
    const { theme, setTheme } = useTheme()
    setTheme('dark')
    expect(theme.value).toBe('dark')
    expect(setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
    expect(setItem).toHaveBeenCalledWith('theme', 'dark')
  })

  it('toggleTheme flips light to dark and dark to light', () => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'light'), setItem: vi.fn() })
    const { theme, toggleTheme } = useTheme()
    toggleTheme()
    expect(theme.value).toBe('dark')
    toggleTheme()
    expect(theme.value).toBe('light')
  })
})
