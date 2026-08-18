import { useTheme } from '@mui/material/styles'

/**
 * Maps our MUI theme onto Clerk's `appearance.variables` shape, so every
 * Clerk-rendered widget (SignIn, UserButton's menu, …) follows the app's
 * theme instead of Clerk's own light-mode defaults. One source of truth —
 * see SignInScreen and Header for usage.
 */
export function useClerkAppearanceVariables() {
  const theme = useTheme()

  return {
    colorPrimary: theme.palette.primary.main,
    colorBackground: theme.palette.background.paper,
    colorText: theme.palette.text.primary,
    colorTextSecondary: theme.palette.text.secondary,
    colorTextOnPrimaryBackground: theme.palette.primary.contrastText,
    // Slightly recessed vs. the card background (background.default is a
    // touch darker than .paper in dark mode, a touch lighter in light mode)
    // — otherwise inputs default to Clerk's own light-mode styling.
    colorInputBackground: theme.palette.background.default,
    colorInputText: theme.palette.text.primary,
    colorNeutral: theme.palette.text.secondary,
    colorDanger: theme.palette.error.main,
    borderRadius: `${theme.shape.borderRadius}px`,
  }
}
