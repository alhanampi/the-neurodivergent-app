import { createTheme } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'
import { colors, fontFamily, radii, spacing } from './tokens'
import type { ResolvedThemeMode } from './theme.interfaces'

/** Builds the MUI theme (also reused as the styled-components theme — see
 * ThemeModeProvider) for a resolved light/dark mode, from the design tokens. */
export function createAppTheme(mode: ResolvedThemeMode): Theme {
  const palette = colors[mode]

  return createTheme({
    palette: {
      mode,
      primary: { main: palette.primary, contrastText: palette.primaryContrast },
      background: { default: palette.background, paper: palette.surface },
      text: { primary: palette.textPrimary, secondary: palette.textSecondary },
      error: { main: palette.error },
      divider: palette.border,
    },
    spacing,
    shape: { borderRadius: radii.medium },
    typography: { fontFamily },
  })
}
