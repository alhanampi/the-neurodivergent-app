export interface AddTimerDialogProps {
  open: boolean
  name: string
  onNameChange: (name: string) => void
  minutes: number
  onMinutesChange: (minutes: number) => void
  min: number
  max: number
  onCancel: () => void
  onConfirm: () => void
}
