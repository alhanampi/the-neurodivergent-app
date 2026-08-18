import { useTranslation } from 'react-i18next'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import { FiMinus, FiPlus } from 'react-icons/fi'
import { useMinutesInput } from './useMinutesInput'
import { MinutesInputWrapper, MinutesUnit } from './MinutesInput.styles'
import type { MinutesInputProps } from './MinutesInput.interfaces'

// Duration picker used both by the "new timer" composer and by an idle
// timer card: type a number directly, scroll over it (mouse wheel) to step
// it, or tap the +/- buttons — see useMinutesInput for the commit logic.
export function MinutesInput({
  value,
  onChange,
  min,
  max,
  step = 5,
  disabled,
  ariaLabel,
}: MinutesInputProps) {
  const { t } = useTranslation()
  const {
    draft,
    handleFocus,
    handleTextChange,
    commitDraft,
    handleKeyDown,
    handleWheel,
    decrement,
    increment,
  } = useMinutesInput({ value, onChange, min, max, step })

  return (
    <MinutesInputWrapper>
      <IconButton
        size="small"
        aria-label={t('timers.decreaseMinutes')}
        onClick={decrement}
        disabled={disabled || value <= min}
      >
        <FiMinus />
      </IconButton>
      <TextField
        size="small"
        value={draft}
        onFocus={handleFocus}
        onChange={handleTextChange}
        onBlur={commitDraft}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label={ariaLabel}
        slotProps={{
          htmlInput: {
            inputMode: 'numeric',
            onWheel: handleWheel,
            style: { textAlign: 'center', width: '3ch' },
          },
        }}
      />
      <MinutesUnit>{t('timers.minutesUnit')}</MinutesUnit>
      <IconButton
        size="small"
        aria-label={t('timers.increaseMinutes')}
        onClick={increment}
        disabled={disabled || value >= max}
      >
        <FiPlus />
      </IconButton>
    </MinutesInputWrapper>
  )
}
