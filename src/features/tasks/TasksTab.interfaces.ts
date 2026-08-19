// Deliberately duplicated from api/tasks.interfaces.ts rather than
// importing across the client/server boundary — same convention as every
// other api/<->src/ boundary in this codebase (see TimersTab.interfaces.ts's
// own comment on TIMER_PRESET_IDS).
export interface TaskRecord {
  id: number
  title: string
  estimatedMinutes: number
  completed: boolean
  createdAt: string
  completedAt: string | null
}
