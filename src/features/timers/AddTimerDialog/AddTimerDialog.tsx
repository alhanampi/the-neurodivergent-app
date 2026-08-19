import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { MinutesInput } from '../MinutesInput/MinutesInput'
import { TaskLinkPicker } from '../TaskLinkPicker/TaskLinkPicker'
import { DialogBody, NameFieldWrapper, TaskLinkWrapper } from './AddTimerDialog.styles'
import type { AddTimerDialogProps } from './AddTimerDialog.interfaces'

// Opened by the composer's "Add timer" button (see useTimersTab's
// openAddDialog, which resets both `name` and `minutes` every time this
// opens) — makes the user actively set a duration (and, optionally, a name)
// instead of silently creating a timer with whatever was left over from last
// time.
export function AddTimerDialog({
  open,
  name,
  onNameChange,
  minutes,
  onMinutesChange,
  min,
  max,
  taskLinkOptions,
  taskLink,
  onTaskLinkChange,
  onCancel,
  onConfirm,
}: AddTimerDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{t('timers.addTimerDialog.title')}</DialogTitle>
      <DialogContent>
        <NameFieldWrapper>
          <TextField
            size="small"
            fullWidth
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            label={t('timers.namePlaceholder')}
          />
        </NameFieldWrapper>
        <DialogBody>
          <MinutesInput
            value={minutes}
            onChange={onMinutesChange}
            min={min}
            max={max}
            ariaLabel={t('timers.durationLabel')}
          />
        </DialogBody>
        {taskLinkOptions.length > 0 && (
          <TaskLinkWrapper>
            <TaskLinkPicker
              options={taskLinkOptions}
              value={taskLink}
              onChange={onTaskLinkChange}
            />
          </TaskLinkWrapper>
        )}
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
