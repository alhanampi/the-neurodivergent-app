import type { TaskLinkOption } from '../TaskLinkPicker/TaskLinkPicker.interfaces'

export interface PomodoroDialogProps {
  open: boolean
  name: string
  onNameChange: (name: string) => void
  focusMinutes: number
  breakMinutes: number
  onFocusMinutesChange: (minutes: number) => void
  onBreakMinutesChange: (minutes: number) => void
  min: number
  max: number
  taskLinkOptions: TaskLinkOption[]
  taskLink: TaskLinkOption | null
  onTaskLinkChange: (option: TaskLinkOption | null) => void
  onCancel: () => void
  onConfirm: () => void
}
