import { useTranslation } from 'react-i18next'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import { FiSend } from 'react-icons/fi'
import { ComposerRow } from './Composer.styles'
import type { ComposerProps } from './Composer.interfaces'

// Draft state lives in useAiChatTab, not here — mirrors nameDraft living in
// useTimersTab rather than AddTimerDialog. Enter sends (Shift+Enter for a
// newline), matching a conventional chat composer.
export function Composer({ value, onChange, onSend, disabled, maxLength }: ComposerProps) {
  const { t } = useTranslation()

  return (
    <ComposerRow>
      <TextField
        fullWidth
        multiline
        maxRows={4}
        size="small"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            if (value.trim().length > 0 && !disabled) onSend()
          }
        }}
        placeholder={t('chat.composer.placeholder')}
        disabled={disabled}
        slotProps={{ htmlInput: { maxLength } }}
      />
      <IconButton
        color="primary"
        aria-label={t('chat.composer.send')}
        onClick={onSend}
        disabled={disabled || value.trim().length === 0}
      >
        <FiSend />
      </IconButton>
    </ComposerRow>
  )
}
