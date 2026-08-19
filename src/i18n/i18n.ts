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

// Keeps <html lang="..."> (hardcoded to "en" in index.html, since that's the
// only reasonable static default) following the live language — without
// this, a screen reader keeps applying English pronunciation/hyphenation
// rules to Spanish content after the user switches in Settings, a real WCAG
// 3.1.1 (Language of Page) failure found during the v0.10.0 accessibility
// pass. Set once for the language i18next actually initialized with (which
// may differ from index.html's "en" default — see i18n.utils.ts's
// detectInitialLanguage), then kept in sync on every future change.
document.documentElement.lang = i18n.language
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
})

export default i18n
