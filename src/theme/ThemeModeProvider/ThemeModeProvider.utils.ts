import { THEME_MODE_STORAGE_KEY } from './ThemeModeProvider.constants'
import type { ResolvedThemeMode, ThemeMode } from '../theme.interfaces'

export function getSystemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveThemeMode(mode: ThemeMode, systemPrefersDark: boolean): ResolvedThemeMode {
  if (mode === 'system') {
    return systemPrefersDark ? 'dark' : 'light'
  }
  return mode
}

export function readStoredThemeMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_MODE_STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}
