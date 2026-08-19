import { describe, expect, it } from 'vitest'
import {
  computeLiveRemainingSeconds,
  computeTaskProgress,
  formatSecondsAsClock,
  getPriorityChipColor,
  sumEstimatedMinutes,
} from './TasksTab.utils'
import type { SubtaskRecord, TaskRecord } from './TasksTab.interfaces'

function makeSubtask(overrides: Partial<SubtaskRecord> = {}): SubtaskRecord {
  return {
    id: 1,
    taskId: 1,
    title: 'Wash dishes',
    estimatedMinutes: 10,
    priority: 'medium',
    dueDate: null,
    completed: false,
    completedAt: null,
    timerStatus: 'idle',
    remainingSeconds: 600,
    timerEndAt: null,
    sortOrder: 0,
    createdAt: 'x',
    ...overrides,
  }
}

function makeTask(subtasks: SubtaskRecord[]): TaskRecord {
  return {
    id: 1,
    conversationId: null,
    title: 'Clean kitchen',
    description: null,
    priority: 'medium',
    dueDate: null,
    createdAt: 'x',
    subtasks,
  }
}

describe('computeLiveRemainingSeconds', () => {
  it('returns the stored remainingSeconds when idle/paused', () => {
    expect(
      computeLiveRemainingSeconds(makeSubtask({ timerStatus: 'paused', remainingSeconds: 42 })),
    ).toBe(42)
  })

  it('derives remaining time from timerEndAt when running', () => {
    const now = Date.parse('2026-08-19T12:00:00Z')
    const subtask = makeSubtask({
      timerStatus: 'running',
      timerEndAt: new Date(now + 30_000).toISOString(),
      remainingSeconds: 999, // stale — should be ignored while running
    })
    expect(computeLiveRemainingSeconds(subtask, now)).toBe(30)
  })

  it('clamps at 0 once the deadline has passed', () => {
    const now = Date.parse('2026-08-19T12:00:00Z')
    const subtask = makeSubtask({
      timerStatus: 'running',
      timerEndAt: new Date(now - 5_000).toISOString(),
    })
    expect(computeLiveRemainingSeconds(subtask, now)).toBe(0)
  })
})

describe('formatSecondsAsClock', () => {
  it('formats as M:SS', () => {
    expect(formatSecondsAsClock(65)).toBe('1:05')
    expect(formatSecondsAsClock(0)).toBe('0:00')
    expect(formatSecondsAsClock(600)).toBe('10:00')
  })
})

describe('sumEstimatedMinutes / computeTaskProgress', () => {
  it("sums every subtask's estimated minutes", () => {
    const task = makeTask([
      makeSubtask({ estimatedMinutes: 10 }),
      makeSubtask({ id: 2, estimatedMinutes: 5 }),
    ])
    expect(sumEstimatedMinutes(task)).toBe(15)
  })

  it('returns 0 progress for a task with no subtasks', () => {
    expect(computeTaskProgress(makeTask([]))).toBe(0)
  })

  it('is all-or-nothing per subtask, weighted by minutes', () => {
    const task = makeTask([
      makeSubtask({ id: 1, estimatedMinutes: 10, completed: true }),
      makeSubtask({ id: 2, estimatedMinutes: 30, completed: false }),
    ])
    expect(computeTaskProgress(task)).toBe(25) // 10 / 40
  })

  it('does not give partial credit for a timer in progress', () => {
    const task = makeTask([
      makeSubtask({
        id: 1,
        estimatedMinutes: 10,
        completed: false,
        timerStatus: 'running',
        remainingSeconds: 300,
      }),
    ])
    expect(computeTaskProgress(task)).toBe(0)
  })

  it('reaches 100 when every subtask is completed', () => {
    const task = makeTask([
      makeSubtask({ id: 1, estimatedMinutes: 10, completed: true }),
      makeSubtask({ id: 2, estimatedMinutes: 5, completed: true }),
    ])
    expect(computeTaskProgress(task)).toBe(100)
  })
})

describe('getPriorityChipColor', () => {
  it('maps each priority to a distinct color', () => {
    expect(getPriorityChipColor('low')).toBe('default')
    expect(getPriorityChipColor('medium')).toBe('warning')
    expect(getPriorityChipColor('high')).toBe('error')
  })
})
