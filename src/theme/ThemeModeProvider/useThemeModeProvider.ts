import { useCallback, useEffect, useMemo, useState } from 'react'
import { THEME_MODE_STORAGE_KEY } from './ThemeModeProvider.constants'
import {
  getSystemPrefersDark,
  readStoredThemeMode,
  resolveThemeMode,
} from './ThemeModeProvider.utils'
import type { ThemeMode } from '../theme.interfaces'

/** Owns the theme-mode state: reads/persists the user's preference, tracks
 * the OS-level preference live, and resolves the two into one mode to render. */
export function useThemeModeProvider() {
  const [mode, setModeState] = useState<ThemeMode>(readStoredThemeMode)
  const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemPrefersDark)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const resolvedMode = resolveThemeMode(mode, systemPrefersDark)

  useEffect(() => {
    // Lets native form controls, scrollbars, etc. render in the right mode too.
    document.documentElement.style.colorScheme = resolvedMode
  }, [resolvedMode])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    localStorage.setItem(THEME_MODE_STORAGE_KEY, next)
  }, [])

  // Memoized so the context value is referentially stable across renders
  // that don't actually change it — avoids re-rendering every consumer.
  return useMemo(() => ({ mode, resolvedMode, setMode }), [mode, resolvedMode, setMode])
}
