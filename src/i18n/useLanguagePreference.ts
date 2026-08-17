import { useTranslation } from 'react-i18next'
import { LANGUAGE_STORAGE_KEY } from './i18n.constants'
import { isSupportedLanguage } from './i18n.utils'
import type { SupportedLanguage } from './i18n.interfaces'

/**
 * The user's current language plus a setter that both switches the live UI
 * (via i18next) and persists the choice. Persistence is localStorage-only
 * for now — iteration 4 (Neon) syncs it to the user's account instead.
 */
export function useLanguagePreference() {
  const { i18n } = useTranslation()
  const language: SupportedLanguage = isSupportedLanguage(i18n.language) ? i18n.language : 'en'

  const setLanguage = (next: SupportedLanguage) => {
    void i18n.changeLanguage(next)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next)
  }

  return { language, setLanguage }
}
