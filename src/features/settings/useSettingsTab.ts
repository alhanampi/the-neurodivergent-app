import type { MouseEvent } from 'react'
import { useClerk, useUser } from '@clerk/clerk-react'
import { useLanguagePreference } from '@/i18n/useLanguagePreference'
import type { SupportedLanguage } from '@/i18n/i18n.interfaces'
import { useThemeMode } from '@/theme/useThemeMode'
import type { ThemeMode } from '@/theme/theme.interfaces'

// TODO(iteration/05-settings-tab, v0.6.0): grow this hook alongside the rest
// of Settings (full profile editing, delete account). For now the account
// section is just an email + sign-out — a seed of the real thing.
export function useSettingsTab() {
  const { language, setLanguage } = useLanguagePreference()
  const { mode, setMode } = useThemeMode()
  const { user } = useUser()
  const { signOut } = useClerk()

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

  const accountLabel = user?.primaryEmailAddress?.emailAddress ?? user?.username ?? ''

  const handleSignOut = () => {
    void signOut()
  }

  return { language, mode, accountLabel, handleLanguageChange, handleThemeChange, handleSignOut }
}
