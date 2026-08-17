import { useMemo } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { createAppTheme } from '../createAppTheme'
import { ThemeModeContext } from './ThemeModeProvider.context'
import { useThemeModeProvider } from './useThemeModeProvider'
import type { ThemeModeProviderProps } from './ThemeModeProvider.interfaces'

// The one place MUI's ThemeProvider and styled-components' ThemeProvider are
// bridged: both receive the exact same theme object, built from our design
// tokens, so a component can be styled with either and stay in sync across
// light/dark mode.
export function ThemeModeProvider({ children }: ThemeModeProviderProps) {
  const themeModeContextValue = useThemeModeProvider()
  const theme = useMemo(
    () => createAppTheme(themeModeContextValue.resolvedMode),
    [themeModeContextValue.resolvedMode],
  )

  return (
    <ThemeModeContext.Provider value={themeModeContextValue}>
      <MuiThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </StyledThemeProvider>
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  )
}
