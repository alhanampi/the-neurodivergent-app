import { useTranslation } from 'react-i18next'
import { SignedIn, UserButton } from '@clerk/clerk-react'
import { FiSettings } from 'react-icons/fi'
import { useClerkAppearanceVariables } from '@/theme/useClerkAppearanceVariables'
import { useHeader } from './useHeader'
import { AccountArea, BrandLink, BrandLogo, BrandName, HeaderBar } from './Header.styles'

// Always rendered (see App.tsx) — above both the signed-in app and the
// sign-in screen — so the app's identity is in the same place no matter
// what's below. Once signed in, the single avatar is the one account entry
// point: its Clerk-provided menu (profile editing, sign out) gains a
// "Settings" item we add ourselves, linking to this app's own preferences
// page — previously a separate gear icon next to the avatar, which read as
// two peer controls for what's really one "account" concern. Settings'
// own Sign out/Delete account buttons stay exactly where they were (see
// SettingsTab.tsx) — only the entry point into Settings moved.
export function Header() {
  const { t } = useTranslation()
  const appearanceVariables = useClerkAppearanceVariables()
  const { goToSettings } = useHeader()

  return (
    <HeaderBar>
      <BrandLink to="/">
        <BrandLogo src="/favicon.svg" alt="" />
        <BrandName>{t('app.shortName')}</BrandName>
      </BrandLink>

      <SignedIn>
        <AccountArea>
          <UserButton appearance={{ variables: appearanceVariables }}>
            <UserButton.MenuItems>
              <UserButton.Action
                label={t('nav.settings')}
                labelIcon={<FiSettings />}
                onClick={goToSettings}
              />
            </UserButton.MenuItems>
          </UserButton>
        </AccountArea>
      </SignedIn>
    </HeaderBar>
  )
}
