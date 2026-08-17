import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en/common.json'
import es from './locales/es/common.json'
import { DEFAULT_LANGUAGE } from './i18n.constants'
import { detectInitialLanguage } from './i18n.utils'

// Side-effect module: importing this initializes the shared i18next
// instance. Import it once, before rendering (see main.tsx and
// src/test/setup.ts) — everything else consumes it through react-i18next's
// hooks, never by importing this instance directly.
void i18n.use(initReactI18next).init({
  resources: {
    en: { common: en },
    es: { common: es },
  },
  lng: detectInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: 'common',
  interpolation: {
    escapeValue: false, // React already escapes output
  },
})

export default i18n
