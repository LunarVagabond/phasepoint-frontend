import { ref } from 'vue'

export type Theme = 'light' | 'dark'

export function getTheme(): Theme {
  const stored = localStorage.getItem('theme') as Theme | null
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function setThemeOnDocument(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}

export function useTheme() {
  const theme = ref<Theme>(getTheme())

  function setTheme(newTheme: Theme) {
    theme.value = newTheme
    setThemeOnDocument(newTheme)
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return { theme, setTheme, toggleTheme }
}
