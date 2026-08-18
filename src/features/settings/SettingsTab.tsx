import { useTranslation } from 'react-i18next'
import { UserButton } from '@clerk/clerk-react'
import { useTheme } from '@mui/material/styles'
import Button from '@mui/material/Button'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { FiSettings } from 'react-icons/fi'
import { useSettingsTab } from './useSettingsTab'
import { DeleteAccountDialog } from './DeleteAccountDialog/DeleteAccountDialog'
import { IconWrapper, SettingsContainer, SettingsSection } from './SettingsTab.styles'

export function SettingsTab() {
  const { t } = useTranslation()
  const theme = useTheme()
  const {
    language,
    mode,
    isDeleteDialogOpen,
    handleLanguageChange,
    handleThemeChange,
    handleSignOut,
    openDeleteDialog,
    closeDeleteDialog,
  } = useSettingsTab()

  return (
    <SettingsContainer>
      <IconWrapper>
        <FiSettings />
      </IconWrapper>
      <Typography variant="h5" component="h1">
        {t('settings.title')}
      </Typography>
      <Typography variant="body1">{t('settings.description')}</Typography>

      <SettingsSection>
        <Typography variant="subtitle2">{t('settings.account.label')}</Typography>
        <UserButton
          showName
          appearance={{
            variables: {
              colorPrimary: theme.palette.primary.main,
              colorBackground: theme.palette.background.paper,
              colorText: theme.palette.text.primary,
              colorTextSecondary: theme.palette.text.secondary,
              colorInputBackground: theme.palette.background.default,
              colorInputText: theme.palette.text.primary,
              colorNeutral: theme.palette.text.secondary,
              colorDanger: theme.palette.error.main,
              borderRadius: `${theme.shape.borderRadius}px`,
            },
          }}
        />
        <Button size="small" variant="outlined" onClick={handleSignOut}>
          {t('settings.account.signOut')}
        </Button>
        <Button size="small" variant="text" color="error" onClick={openDeleteDialog}>
          {t('settings.account.deleteAccount')}
        </Button>
      </SettingsSection>

      <SettingsSection>
        <Typography variant="subtitle2">{t('settings.language.label')}</Typography>
        <ToggleButtonGroup value={language} exclusive size="small" onChange={handleLanguageChange}>
          <ToggleButton value="en">{t('settings.language.en')}</ToggleButton>
          <ToggleButton value="es">{t('settings.language.es')}</ToggleButton>
        </ToggleButtonGroup>
      </SettingsSection>

      <SettingsSection>
        <Typography variant="subtitle2">{t('settings.theme.label')}</Typography>
        <ToggleButtonGroup value={mode} exclusive size="small" onChange={handleThemeChange}>
          <ToggleButton value="light">{t('settings.theme.light')}</ToggleButton>
          <ToggleButton value="dark">{t('settings.theme.dark')}</ToggleButton>
          <ToggleButton value="system">{t('settings.theme.system')}</ToggleButton>
        </ToggleButtonGroup>
      </SettingsSection>

      <DeleteAccountDialog open={isDeleteDialogOpen} onClose={closeDeleteDialog} />
    </SettingsContainer>
  )
}
