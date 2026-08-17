import { SignIn } from '@clerk/clerk-react'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { BrandTagline, BrandTitle, SignInContainer } from './SignInScreen.styles'

// Shown to signed-out users in place of the whole app (see AuthGate).
export function SignInScreen() {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <SignInContainer>
      <BrandTitle>{t('auth.brandTitle')}</BrandTitle>
      <BrandTagline>{t('auth.tagline')}</BrandTagline>
      <SignIn
        routing="virtual"
        appearance={{
          variables: {
            colorPrimary: theme.palette.primary.main,
            colorBackground: theme.palette.background.paper,
            colorText: theme.palette.text.primary,
            colorTextSecondary: theme.palette.text.secondary,
            colorTextOnPrimaryBackground: theme.palette.primary.contrastText,
            // Slightly recessed vs. the card background (background.default
            // is a touch darker than .paper in dark mode, a touch lighter
            // in light mode) — otherwise inputs default to Clerk's own
            // light-mode styling and clash with a dark card.
            colorInputBackground: theme.palette.background.default,
            colorInputText: theme.palette.text.primary,
            colorNeutral: theme.palette.text.secondary,
            colorDanger: theme.palette.error.main,
            borderRadius: `${theme.shape.borderRadius}px`,
          },
        }}
      />
    </SignInContainer>
  )
}
