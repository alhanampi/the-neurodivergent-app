import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { MinutesInput } from '../MinutesInput/MinutesInput'
import { DialogBody } from './AddTimerDialog.styles'
import type { AddTimerDialogProps } from './AddTimerDialog.interfaces'

// Opened by the composer's "Add timer" button (see useTimersTab's
// openAddDialog, which resets `minutes` to DEFAULT_CUSTOM_MINUTES every time
// this opens) — makes the user actively set a duration instead of silently
// creating a timer with whatever the composer last happened to show.
export function AddTimerDialog({
  open,
  minutes,
  onMinutesChange,
  min,
  max,
  onCancel,
  onConfirm,
}: AddTimerDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{t('timers.addTimerDialog.title')}</DialogTitle>
      <DialogContent>
        <DialogBody>
          <MinutesInput
            value={minutes}
            onChange={onMinutesChange}
            min={min}
            max={max}
            ariaLabel={t('timers.durationLabel')}
          />
        </DialogBody>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('timers.addTimerDialog.cancel')}</Button>
        <Button onClick={onConfirm} variant="contained">
          {t('timers.addTimerDialog.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
