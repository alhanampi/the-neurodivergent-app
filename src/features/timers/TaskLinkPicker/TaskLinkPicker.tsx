import { useTranslation } from 'react-i18next'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import type { TaskLinkOption, TaskLinkPickerProps } from './TaskLinkPicker.interfaces'

// Optional "what are you working on?" picker shown in AddTimerDialog and
// PomodoroDialog (see ROADMAP.md's "Timers tab rethink" note) — lets a
// timer started directly from the Timers tab carry a lightweight link to a
// real Task/Subtask, without merging this tab's timer engine with the
// Tasks tab's own per-subtask one. Deliberately not freeSolo: arbitrary
// free-text labeling is already covered by the dialog's own Name field, so
// this stays a plain picker over real Tasks/Subtasks, or nothing.
export function TaskLinkPicker({ options, value, onChange }: TaskLinkPickerProps) {
  const { t } = useTranslation()

  return (
    <Autocomplete<TaskLinkOption>
      size="small"
      options={options}
      value={value}
      onChange={(_event, next) => onChange(next)}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, candidate) => option.key === candidate.key}
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('timers.taskLink.label')}
          placeholder={t('timers.taskLink.placeholder')}
        />
      )}
    />
  )
}
