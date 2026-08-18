import type { MouseEvent } from 'react'
import { useState } from 'react'
import { useClerk } from '@clerk/clerk-react'
import { useLanguagePreference } from '@/i18n/useLanguagePreference'
import type { SupportedLanguage } from '@/i18n/i18n.interfaces'
import { useThemeMode } from '@/theme/useThemeMode'
import type { ThemeMode } from '@/theme/theme.interfaces'

export function useSettingsTab() {
  const { language, setLanguage } = useLanguagePreference()
  const { mode, setMode } = useThemeMode()
  const { signOut } = useClerk()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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

  const handleSignOut = () => {
    void signOut()
  }

  const openDeleteDialog = () => setIsDeleteDialogOpen(true)
  const closeDeleteDialog = () => setIsDeleteDialogOpen(false)

  return {
    language,
    mode,
    isDeleteDialogOpen,
    handleLanguageChange,
    handleThemeChange,
    handleSignOut,
    openDeleteDialog,
    closeDeleteDialog,
  }
}
