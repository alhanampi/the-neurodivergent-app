import { SignIn } from '@clerk/clerk-react'
import { useTranslation } from 'react-i18next'
import { useClerkAppearanceVariables } from '@/theme/useClerkAppearanceVariables'
import { BrandTagline, SignInContainer } from './SignInScreen.styles'

// Shown to signed-out users in place of the whole app (see AuthGate). The
// header (always rendered, see src/app/Header) already carries the app
// name/logo, so this only adds the sign-in-specific tagline.
export function SignInScreen() {
  const { t } = useTranslation()
  const appearanceVariables = useClerkAppearanceVariables()

  return (
    <SignInContainer>
      <BrandTagline>{t('auth.tagline')}</BrandTagline>
      <SignIn routing="virtual" appearance={{ variables: appearanceVariables }} />
    </SignInContainer>
  )
}
