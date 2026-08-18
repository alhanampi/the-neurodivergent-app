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
  onCancel: () => void
  onConfirm: () => void
}
