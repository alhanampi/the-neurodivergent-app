import type { TaskLinkOption } from '../TaskLinkPicker/TaskLinkPicker.interfaces'

export interface AddTimerDialogProps {
  open: boolean
  name: string
  onNameChange: (name: string) => void
  minutes: number
  onMinutesChange: (minutes: number) => void
  min: number
  max: number
  taskLinkOptions: TaskLinkOption[]
  taskLink: TaskLinkOption | null
  onTaskLinkChange: (option: TaskLinkOption | null) => void
  onCancel: () => void
  onConfirm: () => void
}
