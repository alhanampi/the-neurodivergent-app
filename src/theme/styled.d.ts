import type { Theme as MuiTheme } from '@mui/material/styles'

// Bridges styled-components' theme typing to our MUI theme, so
// `styled.div\`color: ${({ theme }) => theme.palette.text.secondary}\`` is
// fully typed instead of `any`. The actual value comes from the same
// createAppTheme() object passed to both providers in ThemeModeProvider.
declare module 'styled-components' {
  export interface DefaultTheme extends MuiTheme {}
}
