import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { MinutesInput } from '../MinutesInput/MinutesInput'
import { PhaseLabel, PhaseRow } from './PomodoroDialog.styles'
import type { PomodoroDialogProps } from './PomodoroDialog.interfaces'

// Opened instead of AddTimerDialog when "Add timer" is pressed with Focus
// selected (see useTimersTab's openAddDialog) — a Focus timer is always a
// full focus/break Pomodoro, not a single duration. Both fields start at the
// classic 20/10 split every time this opens, and the explanation text below
// tracks whatever the user adjusts them to, live.
export function PomodoroDialog({
  open,
  focusMinutes,
  breakMinutes,
  onFocusMinutesChange,
  onBreakMinutesChange,
  min,
  max,
  onCancel,
  onConfirm,
}: PomodoroDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{t('timers.pomodoroDialog.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('timers.pomodoroDialog.explanation', { focusMinutes, breakMinutes })}
        </DialogContentText>

        <PhaseRow>
          <PhaseLabel>{t('timers.pomodoroDialog.focusLabel')}</PhaseLabel>
          <MinutesInput
            value={focusMinutes}
            onChange={onFocusMinutesChange}
            min={min}
            max={max}
            ariaLabel={t('timers.pomodoroDialog.focusLabel')}
          />
        </PhaseRow>
        <PhaseRow>
          <PhaseLabel>{t('timers.pomodoroDialog.breakLabel')}</PhaseLabel>
          <MinutesInput
            value={breakMinutes}
            onChange={onBreakMinutesChange}
            min={min}
            max={max}
            ariaLabel={t('timers.pomodoroDialog.breakLabel')}
          />
        </PhaseRow>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('timers.pomodoroDialog.cancel')}</Button>
        <Button onClick={onConfirm} variant="contained">
          {t('timers.pomodoroDialog.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
