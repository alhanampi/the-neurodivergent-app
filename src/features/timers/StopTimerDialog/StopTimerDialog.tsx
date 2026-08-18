import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import type { StopTimerDialogProps } from './StopTimerDialog.interfaces'

// Only shown for a timer that has actual progress (running or paused) — see
// useTimersTab's requestStop, which skips this entirely for an untouched
// idle timer since there's nothing to lose.
export function StopTimerDialog({ open, timerName, onCancel, onConfirm }: StopTimerDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{t('timers.stopDialog.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {timerName
            ? t('timers.stopDialog.bodyNamed', { name: timerName })
            : t('timers.stopDialog.body')}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('timers.stopDialog.cancel')}</Button>
        <Button onClick={onConfirm} color="error">
          {t('timers.stopDialog.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
