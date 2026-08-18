export interface AddTimerDialogProps {
  open: boolean
  minutes: number
  onMinutesChange: (minutes: number) => void
  min: number
  max: number
  onCancel: () => void
  onConfirm: () => void
}
