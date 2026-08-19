import type { TaskPriority } from '../TasksTab.interfaces'
import type { CreateTaskInput } from '../useTasksTab.utils'

export interface AddTaskDialogProps {
  open: boolean
  onCancel: () => void
  onConfirm: (input: CreateTaskInput) => void
}

export interface UseAddTaskDialogResult {
  title: string
  setTitle: (value: string) => void
  description: string
  setDescription: (value: string) => void
  priority: TaskPriority
  setPriority: (value: TaskPriority) => void
  dueDate: string | null
  setDueDate: (value: string | null) => void
  canConfirm: boolean
  handleConfirm: () => void
}
