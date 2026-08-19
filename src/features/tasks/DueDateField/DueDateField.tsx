import TextField from '@mui/material/TextField'
import type { DueDateFieldProps } from './DueDateField.interfaces'

// Native <input type="date"> via MUI's TextField — no @mui/x-date-pickers
// dependency, same "don't add a date-picker package for a personal-use
// field" decision the Dashboard tab already made for its range filter. An
// empty string from the native picker (its own "cleared" state) is
// normalized to null.
export function DueDateField({ value, onChange, label, size = 'small' }: DueDateFieldProps) {
  return (
    <TextField
      type="date"
      size={size}
      label={label}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value.length > 0 ? event.target.value : null)}
      slotProps={{ inputLabel: { shrink: true } }}
    />
  )
}
