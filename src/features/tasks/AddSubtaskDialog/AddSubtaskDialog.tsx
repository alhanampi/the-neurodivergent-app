import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { MinutesInput } from '@/features/timers/MinutesInput/MinutesInput'
import { DueDateField } from '../DueDateField/DueDateField'
import { PriorityControl } from '../PriorityControl/PriorityControl'
import { MAX_SUBTASK_MINUTES, MIN_SUBTASK_MINUTES } from '../TasksTab.constants'
import { useAddSubtaskDialog } from './useAddSubtaskDialog'
import { FieldsColumn, InlineFieldsRow } from '../AddTaskDialog/AddTaskDialog.styles'
import type { AddSubtaskDialogProps } from './AddSubtaskDialog.interfaces'

// Reuses MinutesInput from the timers feature (same cross-feature reuse
// PlanPreviewCard already established) and the AddTaskDialog's layout
// styles — same two-field-row shape, no need for a separate styles file.
export function AddSubtaskDialog({ open, onCancel, onConfirm }: AddSubtaskDialogProps) {
  const { t } = useTranslation()
  const {
    title,
    setTitle,
    minutes,
    setMinutes,
    priority,
    setPriority,
    dueDate,
    setDueDate,
    canConfirm,
    handleConfirm,
  } = useAddSubtaskDialog({ open, onConfirm })

  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{t('tasks.addSubtaskDialog.title')}</DialogTitle>
      <DialogContent>
        <FieldsColumn>
          <TextField
            size="small"
            fullWidth
            label={t('tasks.addSubtaskDialog.titleLabel')}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <MinutesInput
            value={minutes}
            onChange={setMinutes}
            min={MIN_SUBTASK_MINUTES}
            max={MAX_SUBTASK_MINUTES}
            ariaLabel={t('tasks.addSubtaskDialog.minutesLabel')}
          />
          <InlineFieldsRow>
            <PriorityControl value={priority} onChange={setPriority} />
            <DueDateField value={dueDate} onChange={setDueDate} label={t('tasks.dueDateLabel')} />
          </InlineFieldsRow>
        </FieldsColumn>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('tasks.addSubtaskDialog.cancel')}</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={!canConfirm}>
          {t('tasks.addSubtaskDialog.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
