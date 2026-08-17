import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useTranslation } from 'react-i18next'
import { LANGUAGE_STORAGE_KEY } from './i18n.constants'
import { isSupportedLanguage } from './i18n.utils'
import { fetchAccountLanguage, persistAccountLanguage } from './useLanguagePreference.utils'
import type { SupportedLanguage } from './i18n.interfaces'

/**
 * The user's current language plus a setter that switches the live UI (via
 * i18next), persists it to localStorage, and — once signed in — keeps it in
 * sync with their account (api/preferences.ts) so it follows them across
 * devices instead of being stuck to one browser.
 */
export function useLanguagePreference() {
  const { i18n } = useTranslation()
  const { isSignedIn, getToken } = useAuth()
  const language: SupportedLanguage = isSupportedLanguage(i18n.language) ? i18n.language : 'en'

  // On sign-in, the account's stored preference wins over whatever was
  // already showing (e.g. a different device's last choice).
  useEffect(() => {
    if (!isSignedIn) return

    let cancelled = false
    void fetchAccountLanguage(getToken).then((accountLanguage) => {
      if (cancelled || !accountLanguage || accountLanguage === i18n.language) return
      void i18n.changeLanguage(accountLanguage)
      localStorage.setItem(LANGUAGE_STORAGE_KEY, accountLanguage)
    })

    return () => {
      cancelled = true
    }
  }, [isSignedIn, getToken, i18n])

  const setLanguage = (next: SupportedLanguage) => {
    void i18n.changeLanguage(next)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next)
    if (isSignedIn) {
      void persistAccountLanguage(next, getToken)
    }
  }

  return { language, setLanguage }
}
