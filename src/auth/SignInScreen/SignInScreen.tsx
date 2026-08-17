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
            borderRadius: `${theme.shape.borderRadius}px`,
          },
        }}
      />
    </SignInContainer>
  )
}
