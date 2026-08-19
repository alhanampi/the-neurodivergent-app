// Deliberately duplicated from src/i18n/i18n.constants.ts rather than
// importing across the client/server boundary — see api/preferences.utils.ts.
export const SUPPORTED_LANGUAGES = ['en', 'es'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export interface PreferencesResponseBody {
  language: SupportedLanguage
}
