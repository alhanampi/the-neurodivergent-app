/** One selectable entry in the "what are you working on?" picker — either a
 * whole Task (`subtaskId: null`) or one of its (not-yet-completed)
 * Subtasks. `key` is a stable identity distinct from `taskId`/`subtaskId`
 * alone, since a Task and one of its own Subtasks would otherwise share the
 * same `taskId`. */
export interface TaskLinkOption {
  key: string
  taskId: number
  subtaskId: number | null
  label: string
}

export interface TaskLinkPickerProps {
  options: TaskLinkOption[]
  value: TaskLinkOption | null
  onChange: (option: TaskLinkOption | null) => void
}
