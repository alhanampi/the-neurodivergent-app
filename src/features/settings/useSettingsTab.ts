import type { MouseEvent } from 'react'
import { useLanguagePreference } from '@/i18n/useLanguagePreference'
import type { SupportedLanguage } from '@/i18n/i18n.interfaces'
import { useThemeMode } from '@/theme/useThemeMode'
import type { ThemeMode } from '@/theme/theme.interfaces'

// TODO(iteration/05-settings-tab, v0.6.0): grow this hook alongside the rest
// of Settings (account/profile via Clerk, sign out, delete account). For now
// it only owns the two preferences that already exist: language and theme.
export function useSettingsTab() {
  const { language, setLanguage } = useLanguagePreference()
  const { mode, setMode } = useThemeMode()

  const handleLanguageChange = (
    _event: MouseEvent<HTMLElement>,
    next: SupportedLanguage | null,
  ) => {
    if (next) {
      setLanguage(next)
    }
  }

  const handleThemeChange = (_event: MouseEvent<HTMLElement>, next: ThemeMode | null) => {
    if (next) {
      setMode(next)
    }
  }

  return { language, mode, handleLanguageChange, handleThemeChange }
}
