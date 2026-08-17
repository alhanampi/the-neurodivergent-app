import { useContext } from 'react'
import { ThemeModeContext } from './ThemeModeProvider/ThemeModeProvider.context'

/** Public hook for reading/changing the theme mode from anywhere in the
 * app (e.g. Settings). Must be called under `<ThemeModeProvider>`. */
export function useThemeMode() {
  const context = useContext(ThemeModeContext)
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider')
  }
  return context
}
