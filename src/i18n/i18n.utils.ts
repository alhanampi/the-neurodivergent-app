import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from './i18n.constants'
import type { SupportedLanguage } from './i18n.interfaces'

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
}

/**
 * Preference order: a previously saved choice, then the browser's language,
 * then the app default. Runs once, synchronously, before i18next initializes
 * — later changes go through `useLanguagePreference` instead.
 */
export function detectInitialLanguage(): SupportedLanguage {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (stored && isSupportedLanguage(stored)) {
    return stored
  }

  const browserLanguage = navigator.language.slice(0, 2)
  if (isSupportedLanguage(browserLanguage)) {
    return browserLanguage
  }

  return DEFAULT_LANGUAGE
}
