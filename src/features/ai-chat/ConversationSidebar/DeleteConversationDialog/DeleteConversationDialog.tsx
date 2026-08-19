import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import type { DeleteConversationDialogProps } from './DeleteConversationDialog.interfaces'

// Mirrors StopTimerDialog exactly — only shown for a conversation the user
// actually asked to delete (see useAiChatTab's pendingDeleteId).
export function DeleteConversationDialog({
  open,
  conversationTitle,
  onCancel,
  onConfirm,
}: DeleteConversationDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{t('chat.sidebar.deleteDialog.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('chat.sidebar.deleteDialog.body', { title: conversationTitle })}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('chat.sidebar.deleteDialog.cancel')}</Button>
        <Button onClick={onConfirm} color="error">
          {t('chat.sidebar.deleteDialog.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
