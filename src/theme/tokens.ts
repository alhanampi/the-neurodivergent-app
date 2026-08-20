/**
 * Design tokens: the single source of truth for color/spacing/typography
 * values. Framework-agnostic on purpose — createAppTheme.ts is the only
 * place that turns these into an MUI Theme.
 *
 * Palette choice is deliberate for a neurodivergent-focused app: muted,
 * low-saturation tones rather than high-contrast/high-energy colors, and a
 * warm terracotta instead of a harsh red for error states.
 */

export const colors = {
  light: {
    primary: '#3E7C8C',
    // Pure white, not the near-white F5F7F8 used for backgrounds — used only
    // as contrastText on top of `primary` (e.g. filled button labels).
    // F5F7F8-on-#3E7C8C measured 4.38:1, just under WCAG AA's 4.5:1 minimum
    // for normal text (found during the v0.10.0 accessibility pass); white
    // clears it at 4.70:1 with a barely perceptible visual change.
    primaryContrast: '#FFFFFF',
    background: '#F5F7F8',
    surface: '#FFFFFF',
    textPrimary: '#1F2A2E',
    textSecondary: '#5B6B73',
    border: '#D8E0E3',
    error: '#B3541E',
  },
  dark: {
    primary: '#6FA8B8',
    primaryContrast: '#0F1417',
    background: '#12181B',
    surface: '#1B2327',
    textPrimary: '#EDF2F4',
    textSecondary: '#A9B7BC',
    border: '#2C363B',
    error: '#D98255',
  },
} as const

/** Base spacing unit in px — matches MUI's default `theme.spacing()` step. */
export const spacing = 8

export const radii = {
  small: 6,
  medium: 12,
  large: 20,
}

export const fontFamily = [
  'Roboto',
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'sans-serif',
].join(', ')

/** Fixed-position chrome heights (px) — shared so the header, the bottom
 * nav, and anything that needs to pad around them (page content, the
 * sign-in screen) never drift out of sync with each other. */
export const layout = {
  headerHeight: 56,
  bottomNavHeight: 56,
}
