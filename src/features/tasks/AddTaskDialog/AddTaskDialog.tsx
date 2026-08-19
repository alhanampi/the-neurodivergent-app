import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { DueDateField } from '../DueDateField/DueDateField'
import { PriorityControl } from '../PriorityControl/PriorityControl'
import { useAddTaskDialog } from './useAddTaskDialog'
import { FieldsColumn, InlineFieldsRow } from './AddTaskDialog.styles'
import type { AddTaskDialogProps } from './AddTaskDialog.interfaces'

// Creates a Task with no subtasks yet ("steps: []") — subtasks are added
// afterward via AddSubtaskDialog, one per task. Follows AddTimerDialog's
// fully-controlled popup structure.
export function AddTaskDialog({ open, onCancel, onConfirm }: AddTaskDialogProps) {
  const { t } = useTranslation()
  const {
    title,
    setTitle,
    description,
    setDescription,
    priority,
    setPriority,
    dueDate,
    setDueDate,
    canConfirm,
    handleConfirm,
  } = useAddTaskDialog({ open, onConfirm })

  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{t('tasks.addTaskDialog.title')}</DialogTitle>
      <DialogContent>
        <FieldsColumn>
          <TextField
            size="small"
            fullWidth
            label={t('tasks.addTaskDialog.titleLabel')}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <TextField
            size="small"
            fullWidth
            multiline
            minRows={2}
            label={t('tasks.addTaskDialog.descriptionLabel')}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <InlineFieldsRow>
            <PriorityControl value={priority} onChange={setPriority} />
            <DueDateField value={dueDate} onChange={setDueDate} label={t('tasks.dueDateLabel')} />
          </InlineFieldsRow>
        </FieldsColumn>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('tasks.addTaskDialog.cancel')}</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={!canConfirm}>
          {t('tasks.addTaskDialog.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
