export interface StopTimerDialogProps {
  open: boolean
  /** Display name of the timer pending confirmation — null while no dialog
   * is open, so the parent can pass it straight from a `.find()` lookup. */
  timerName: string | null
  onCancel: () => void
  onConfirm: () => void
}
