import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { useDeleteAccountDialog } from './useDeleteAccountDialog'
import { ErrorText } from './DeleteAccountDialog.styles'
import type { DeleteAccountDialogProps } from './DeleteAccountDialog.interfaces'

export function DeleteAccountDialog({ open, onClose }: DeleteAccountDialogProps) {
  const { t } = useTranslation()
  const { isDeleting, hasError, handleConfirmDelete } = useDeleteAccountDialog()

  return (
    <Dialog open={open} onClose={isDeleting ? undefined : onClose}>
      <DialogTitle>{t('settings.account.deleteDialog.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('settings.account.deleteDialog.body')}</DialogContentText>
        {hasError && <ErrorText>{t('settings.account.deleteDialog.error')}</ErrorText>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>
          {t('settings.account.deleteDialog.cancel')}
        </Button>
        <Button onClick={handleConfirmDelete} color="error" disabled={isDeleting}>
          {isDeleting ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            t('settings.account.deleteDialog.confirm')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
