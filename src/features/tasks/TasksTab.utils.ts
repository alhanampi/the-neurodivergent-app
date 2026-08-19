import type { SubtaskRecord, TaskPriority, TaskRecord } from './TasksTab.interfaces'

/** A subtask's `remainingSeconds` column is only authoritative while
 * idle/paused — while running, the live value is `timerEndAt - now`,
 * re-derived every render tick rather than trusting a stale server
 * snapshot. Mirrors the Timers tab's wall-clock technique
 * (TimersTab.utils.ts's computeRemainingSeconds) but reads from the
 * server-persisted `timerEndAt` instead of pure client state. */
export function computeLiveRemainingSeconds(subtask: SubtaskRecord, nowMs = Date.now()): number {
  if (subtask.timerStatus !== 'running' || !subtask.timerEndAt) return subtask.remainingSeconds
  const endMs = new Date(subtask.timerEndAt).getTime()
  return Math.max(0, Math.ceil((endMs - nowMs) / 1000))
}

export function formatSecondsAsClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(clamped / 60)
  const seconds = clamped % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function sumEstimatedMinutes(task: TaskRecord): number {
  return task.subtasks.reduce((total, subtask) => total + subtask.estimatedMinutes, 0)
}

/** All-or-nothing per subtask, weighted by estimatedMinutes — a subtask
 * only contributes once it's marked completed, never for partial timer
 * progress (confirmed product decision: predictable and can't regress if
 * time is subtracted from a subtask mid-run). Returns 0-100, and 0 for a
 * task with no subtasks yet. */
export function computeTaskProgress(task: TaskRecord): number {
  const totalMinutes = sumEstimatedMinutes(task)
  if (totalMinutes === 0) return 0

  const completedMinutes = task.subtasks
    .filter((subtask) => subtask.completed)
    .reduce((total, subtask) => total + subtask.estimatedMinutes, 0)

  return Math.round((completedMinutes / totalMinutes) * 100)
}

const PRIORITY_COLOR: Record<TaskPriority, 'default' | 'warning' | 'error'> = {
  low: 'default',
  medium: 'warning',
  high: 'error',
}

export function getPriorityChipColor(priority: TaskPriority): 'default' | 'warning' | 'error' {
  return PRIORITY_COLOR[priority]
}
