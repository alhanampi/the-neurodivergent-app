import type { TaskPriority } from '../TasksTab.interfaces'
import type { CreateSubtaskInput } from '../useTasksTab.utils'

export interface AddSubtaskDialogProps {
  open: boolean
  onCancel: () => void
  onConfirm: (input: Omit<CreateSubtaskInput, 'taskId'>) => void
}

export interface UseAddSubtaskDialogResult {
  title: string
  setTitle: (value: string) => void
  minutes: number
  setMinutes: (value: number) => void
  priority: TaskPriority
  setPriority: (value: TaskPriority) => void
  dueDate: string | null
  setDueDate: (value: string | null) => void
  canConfirm: boolean
  handleConfirm: () => void
}
