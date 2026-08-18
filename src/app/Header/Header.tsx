import { useTranslation } from 'react-i18next'
import { SignedIn, UserButton } from '@clerk/clerk-react'
import IconButton from '@mui/material/IconButton'
import { FiSettings } from 'react-icons/fi'
import { useClerkAppearanceVariables } from '@/theme/useClerkAppearanceVariables'
import { useHeader } from './useHeader'
import { AccountArea, BrandLink, BrandLogo, BrandName, HeaderBar } from './Header.styles'

// Always rendered (see App.tsx) — above both the signed-in app and the
// sign-in screen — so the app's identity and, once signed in, quick access
// to the account and Settings are in the same place no matter what's below.
export function Header() {
  const { t } = useTranslation()
  const appearanceVariables = useClerkAppearanceVariables()
  const { goToSettings, isSettingsActive } = useHeader()

  return (
    <HeaderBar>
      <BrandLink to="/">
        <BrandLogo src="/favicon.svg" alt="" />
        <BrandName>{t('app.shortName')}</BrandName>
      </BrandLink>

      <SignedIn>
        <AccountArea>
          <UserButton appearance={{ variables: appearanceVariables }} />
          <IconButton
            onClick={goToSettings}
            color={isSettingsActive ? 'primary' : 'default'}
            aria-label={t('nav.settings')}
            size="small"
          >
            <FiSettings />
          </IconButton>
        </AccountArea>
      </SignedIn>
    </HeaderBar>
  )
}
