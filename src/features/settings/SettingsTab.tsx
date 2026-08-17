import { useTranslation } from 'react-i18next'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { FiSettings } from 'react-icons/fi'
import { useSettingsTab } from './useSettingsTab'
import { IconWrapper, SettingsContainer, SettingsSection } from './SettingsTab.styles'

export function SettingsTab() {
  const { t } = useTranslation()
  const { language, mode, handleLanguageChange, handleThemeChange } = useSettingsTab()

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
    </SettingsContainer>
  )
}
