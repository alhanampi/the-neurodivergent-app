import type { ReactNode } from 'react'
import type { ResolvedThemeMode, ThemeMode } from '../theme.interfaces'

export interface ThemeModeProviderProps {
  children: ReactNode
}

export interface ThemeModeContextValue {
  /** The user's stored preference — may be 'system'. */
  mode: ThemeMode
  /** 'system' resolved against the OS/browser preference; always light or dark. */
  resolvedMode: ResolvedThemeMode
  setMode: (mode: ThemeMode) => void
}
