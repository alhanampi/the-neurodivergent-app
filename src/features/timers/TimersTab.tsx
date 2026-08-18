import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { FiBell, FiClock, FiPause, FiPlay, FiPlus, FiVolume2, FiVolumeX, FiX } from 'react-icons/fi'
import { useTimersTab } from './useTimersTab'
import { CUSTOM_PRESET_ID, MAX_CUSTOM_MINUTES, MIN_CUSTOM_MINUTES } from './TimersTab.constants'
import {
  formatSeconds,
  formatSessionTimestamp,
  getPresetTranslationKey,
  getProgressFraction,
} from './TimersTab.utils'
import { MinutesInput } from './MinutesInput/MinutesInput'
import { AddTimerDialog } from './AddTimerDialog/AddTimerDialog'
import { StopTimerDialog } from './StopTimerDialog/StopTimerDialog'
import {
  ComposerSection,
  HeaderRow,
  HistoryEmpty,
  HistoryItem,
  HistoryItemLabel,
  HistoryItemMeta,
  HistoryList,
  HistorySection,
  IconWrapper,
  NotificationBanner,
  PresetRow,
  TimerCard,
  TimerCardInfo,
  TimerCardName,
  TimerCardTime,
  TimersContainer,
  TimersList,
} from './TimersTab.styles'
import type { TimerPresetId } from './TimersTab.interfaces'

export function TimersTab() {
  const { t, i18n } = useTranslation()
  const {
    timers,
    presets,
    selectedPresetId,
    draftMinutes,
    nameDraft,
    isAddDialogOpen,
    history,
    isHistoryLoading,
    notificationPermission,
    isSoundEnabled,
    pendingStopId,
    selectPreset,
    setDraftMinutes,
    setNameDraft,
    openAddDialog,
    closeAddDialog,
    addTimer,
    updateTimerMinutes,
    toggleTimer,
    requestStop,
    cancelStopRequest,
    confirmStop,
    requestNotifications,
    toggleSound,
  } = useTimersTab()

  const pendingTimer = timers.find((timer) => timer.id === pendingStopId) ?? null
  const pendingTimerName = pendingTimer
    ? (pendingTimer.name ?? t(getPresetTranslationKey(pendingTimer.presetId)))
    : null

  return (
    <TimersContainer>
      <HeaderRow>
        <IconWrapper>
          <FiClock />
        </IconWrapper>
        <Typography variant="h5" component="h1">
          {t('timers.title')}
        </Typography>
        <IconButton
          size="small"
          onClick={toggleSound}
          aria-label={isSoundEnabled ? t('timers.sound.disable') : t('timers.sound.enable')}
        >
          {isSoundEnabled ? <FiVolume2 /> : <FiVolumeX />}
        </IconButton>
      </HeaderRow>

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

      <ComposerSection>
        <PresetRow>
          <ToggleButtonGroup
            value={selectedPresetId}
            exclusive
            size="small"
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

        <TextField
          size="small"
          fullWidth
          value={nameDraft}
          onChange={(event) => setNameDraft(event.target.value)}
          placeholder={t('timers.namePlaceholder')}
        />

        <Button variant="contained" startIcon={<FiPlus />} onClick={openAddDialog}>
          {t('timers.addTimer')}
        </Button>
      </ComposerSection>

      {timers.length === 0 ? (
        <HistoryEmpty>{t('timers.noActiveTimers')}</HistoryEmpty>
      ) : (
        <TimersList>
          {timers.map((timer) => (
            <TimerCard key={timer.id}>
              <IconButton
                aria-label={timer.status === 'running' ? t('timers.pause') : t('timers.start')}
                onClick={() => toggleTimer(timer.id)}
              >
                {timer.status === 'running' ? <FiPause size={20} /> : <FiPlay size={20} />}
              </IconButton>

              <TimerCardInfo>
                <TimerCardName>
                  {timer.name || t(getPresetTranslationKey(timer.presetId))}
                </TimerCardName>
                <LinearProgress
                  variant="determinate"
                  value={getProgressFraction(timer.plannedSeconds, timer.remainingSeconds) * 100}
                />
              </TimerCardInfo>

              {timer.status === 'idle' ? (
                <MinutesInput
                  value={Math.round(timer.plannedSeconds / 60)}
                  onChange={(minutes) => updateTimerMinutes(timer.id, minutes)}
                  min={MIN_CUSTOM_MINUTES}
                  max={MAX_CUSTOM_MINUTES}
                  ariaLabel={t('timers.durationLabel')}
                />
              ) : (
                <TimerCardTime>{formatSeconds(timer.remainingSeconds)}</TimerCardTime>
              )}

              <IconButton
                size="small"
                aria-label={t('timers.stop')}
                onClick={() => requestStop(timer.id)}
              >
                <FiX />
              </IconButton>
            </TimerCard>
          ))}
        </TimersList>
      )}

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

      <AddTimerDialog
        open={isAddDialogOpen}
        minutes={draftMinutes}
        onMinutesChange={setDraftMinutes}
        min={MIN_CUSTOM_MINUTES}
        max={MAX_CUSTOM_MINUTES}
        onCancel={closeAddDialog}
        onConfirm={addTimer}
      />

      <StopTimerDialog
        open={pendingStopId !== null}
        timerName={pendingTimerName}
        onCancel={cancelStopRequest}
        onConfirm={confirmStop}
      />
    </TimersContainer>
  )
}
