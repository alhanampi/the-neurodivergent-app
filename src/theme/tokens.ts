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
    primaryContrast: '#F5F7F8',
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
