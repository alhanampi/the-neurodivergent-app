export interface DeleteConversationDialogProps {
  open: boolean
  /** Title of the conversation pending deletion — null while no dialog is
   * open, so the parent can pass it straight from a `.find()` lookup (same
   * convention as StopTimerDialog's timerName). */
  conversationTitle: string | null
  onCancel: () => void
  onConfirm: () => void
}
