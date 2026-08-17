import '@testing-library/jest-dom/vitest'
import '@/i18n/i18n'

// jsdom doesn't implement matchMedia — polyfill it so anything that reads
// prefers-color-scheme (ThemeModeProvider) or other media queries (MUI's
// useMediaQuery) doesn't crash in tests. Defaults to "no match".
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}
