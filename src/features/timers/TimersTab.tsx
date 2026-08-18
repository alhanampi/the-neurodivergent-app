import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { FiBell, FiClock, FiMinus, FiPlus } from 'react-icons/fi'
import { useTimersTab } from './useTimersTab'
import { CUSTOM_PRESET_ID } from './TimersTab.constants'
import { formatSeconds, formatSessionTimestamp, getPresetTranslationKey } from './TimersTab.utils'
import {
  ControlsRow,
  CountdownText,
  CountdownWrapper,
  CustomRow,
  HistoryEmpty,
  HistoryItem,
  HistoryItemLabel,
  HistoryItemMeta,
  HistoryList,
  HistorySection,
  IconWrapper,
  MinutesStepper,
  MinutesValue,
  NotificationBanner,
  PresetRow,
  TimersContainer,
} from './TimersTab.styles'
import type { TimerPresetId } from './TimersTab.interfaces'

const CUSTOM_MINUTES_STEP = 5

export function TimersTab() {
  const { t, i18n } = useTranslation()
  const {
    status,
    presets,
    selectedPresetId,
    customMinutes,
    customLabel,
    displaySeconds,
    progressFraction,
    history,
    isHistoryLoading,
    notificationPermission,
    selectPreset,
    setCustomMinutes,
    setCustomLabel,
    start,
    pauseOrResume,
    stop,
    requestNotifications,
  } = useTimersTab()

  const isIdle = status === 'idle'

  return (
    <TimersContainer>
      <IconWrapper>
        <FiClock />
      </IconWrapper>
      <Typography variant="h5" component="h1">
        {t('timers.title')}
      </Typography>

      {notificationPermission === 'default' && (
        <NotificationBanner>
          <Typography variant="body2">{t('timers.notification.banner')}</Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<FiBell />}
            onClick={requestNotifications}
          >
            {t('timers.notification.enable')}
          </Button>
        </NotificationBanner>
      )}

      <PresetRow>
        <ToggleButtonGroup
          value={selectedPresetId}
          exclusive
          size="small"
          disabled={!isIdle}
          onChange={(_event, next: TimerPresetId | null) => {
            if (next) selectPreset(next)
          }}
        >
          {presets.map((preset) => (
            <ToggleButton key={preset.id} value={preset.id}>
              {t(getPresetTranslationKey(preset.id))}
            </ToggleButton>
          ))}
          <ToggleButton value={CUSTOM_PRESET_ID}>
            {t(getPresetTranslationKey(CUSTOM_PRESET_ID))}
          </ToggleButton>
        </ToggleButtonGroup>
      </PresetRow>

      {selectedPresetId === CUSTOM_PRESET_ID && (
        <CustomRow>
          <MinutesStepper>
            <IconButton
              size="small"
              aria-label={t('timers.decreaseMinutes')}
              disabled={!isIdle}
              onClick={() => setCustomMinutes(customMinutes - CUSTOM_MINUTES_STEP)}
            >
              <FiMinus />
            </IconButton>
            <MinutesValue>{t('timers.minutesValue', { count: customMinutes })}</MinutesValue>
            <IconButton
              size="small"
              aria-label={t('timers.increaseMinutes')}
              disabled={!isIdle}
              onClick={() => setCustomMinutes(customMinutes + CUSTOM_MINUTES_STEP)}
            >
              <FiPlus />
            </IconButton>
          </MinutesStepper>
          <TextField
            size="small"
            fullWidth
            disabled={!isIdle}
            value={customLabel}
            onChange={(event) => setCustomLabel(event.target.value)}
            placeholder={t('timers.customLabelPlaceholder')}
          />
        </CustomRow>
      )}

      <CountdownWrapper>
        <CircularProgress
          variant="determinate"
          value={progressFraction * 100}
          size={220}
          thickness={3}
        />
        <CountdownText>{formatSeconds(displaySeconds)}</CountdownText>
      </CountdownWrapper>

      <ControlsRow>
        {isIdle ? (
          <Button variant="contained" onClick={start}>
            {t('timers.start')}
          </Button>
        ) : (
          <>
            <Button variant="outlined" onClick={pauseOrResume}>
              {status === 'running' ? t('timers.pause') : t('timers.resume')}
            </Button>
            <Button variant="contained" color="error" onClick={stop}>
              {t('timers.stop')}
            </Button>
          </>
        )}
      </ControlsRow>

      <HistorySection>
        <Typography variant="subtitle2">{t('timers.history.title')}</Typography>
        {isHistoryLoading && <HistoryEmpty>{t('timers.history.loading')}</HistoryEmpty>}
        {!isHistoryLoading && history.length === 0 && (
          <HistoryEmpty>{t('timers.history.empty')}</HistoryEmpty>
        )}
        {!isHistoryLoading && history.length > 0 && (
          <HistoryList>
            {history.map((session) => (
              <HistoryItem key={session.id}>
                <HistoryItemLabel>
                  <Typography variant="body2">
                    {session.label || t(getPresetTranslationKey(session.presetId))}
                  </Typography>
                  <HistoryItemMeta>
                    {formatSessionTimestamp(session.startedAt, i18n.language)}
                  </HistoryItemMeta>
                </HistoryItemLabel>
                <Typography variant="body2" color="text.secondary">
                  {formatSeconds(session.actualSeconds)}
                  {' · '}
                  {session.completed ? t('timers.history.completed') : t('timers.history.stopped')}
                </Typography>
              </HistoryItem>
            ))}
          </HistoryList>
        )}
      </HistorySection>
    </TimersContainer>
  )
}
