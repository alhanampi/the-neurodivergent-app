import { describe, expect, it } from 'vitest'
import {
  addMinutesToTimerInstance,
  buildTaskLinkOptions,
  clampCustomMinutes,
  clampMinutes,
  computeRemainingSeconds,
  createTimerId,
  formatSeconds,
  formatSessionTimestamp,
  getActivePhase,
  getActivePresetId,
  getPhaseTranslationKey,
  getPresetDefaultMinutes,
  getPresetTranslationKey,
  getProgressFraction,
  sanitizeTimerName,
} from './TimersTab.utils'
import { DEFAULT_CUSTOM_MINUTES, MAX_TIMER_NAME_LENGTH } from './TimersTab.constants'
import type { TimerInstance } from './TimersTab.interfaces'
import type { TaskRecord } from '@/features/tasks/TasksTab.interfaces'

describe('formatSeconds', () => {
  it('formats sub-hour durations as M:SS', () => {
    expect(formatSeconds(0)).toBe('0:00')
    expect(formatSeconds(65)).toBe('1:05')
    expect(formatSeconds(1500)).toBe('25:00')
  })

  it('formats hour-plus durations as H:MM:SS', () => {
    expect(formatSeconds(3661)).toBe('1:01:01')
  })

  it('clamps negative input to zero', () => {
    expect(formatSeconds(-5)).toBe('0:00')
  })
})

describe('computeRemainingSeconds', () => {
  it('derives remaining seconds from an end timestamp', () => {
    const now = 1_000_000
    expect(computeRemainingSeconds(now + 10_000, now)).toBe(10)
  })

  it('never goes negative once the end timestamp has passed', () => {
    const now = 1_000_000
    expect(computeRemainingSeconds(now - 5_000, now)).toBe(0)
  })
})

describe('clampCustomMinutes', () => {
  it('clamps within the allowed range', () => {
    expect(clampCustomMinutes(0)).toBe(1)
    expect(clampCustomMinutes(500)).toBe(180)
    expect(clampCustomMinutes(42)).toBe(42)
  })

  it('falls back to the minimum for NaN', () => {
    expect(clampCustomMinutes(Number.NaN)).toBe(1)
  })
})

describe('clampMinutes', () => {
  it('clamps within the given range', () => {
    expect(clampMinutes(0, 1, 180)).toBe(1)
    expect(clampMinutes(500, 1, 180)).toBe(180)
    expect(clampMinutes(42, 1, 180)).toBe(42)
    expect(clampMinutes(42, 50, 60)).toBe(50)
  })

  it('falls back to the minimum for NaN', () => {
    expect(clampMinutes(Number.NaN, 1, 180)).toBe(1)
  })
})

describe('getPresetDefaultMinutes', () => {
  it('resolves a known preset to its default duration', () => {
    expect(getPresetDefaultMinutes('short-break')).toBe(5)
    expect(getPresetDefaultMinutes('long-break')).toBe(15)
  })

  it('falls back to DEFAULT_CUSTOM_MINUTES for custom', () => {
    expect(getPresetDefaultMinutes('custom')).toBe(DEFAULT_CUSTOM_MINUTES)
  })

  it('falls back to DEFAULT_CUSTOM_MINUTES for pomodoro-focus, which has no single-phase default', () => {
    // Focus no longer creates a single-duration timer — selecting it opens
    // the Pomodoro dialog instead, so this preset carries no `minutes` of
    // its own (see TIMER_PRESETS).
    expect(getPresetDefaultMinutes('pomodoro-focus')).toBe(DEFAULT_CUSTOM_MINUTES)
  })
})

describe('getPresetTranslationKey', () => {
  it('namespaces the preset id under timers.presets', () => {
    expect(getPresetTranslationKey('pomodoro-focus')).toBe('timers.presets.pomodoro-focus')
    expect(getPresetTranslationKey('custom')).toBe('timers.presets.custom')
  })
})

describe('formatSessionTimestamp', () => {
  it('formats a valid ISO date without throwing', () => {
    const result = formatSessionTimestamp('2026-08-18T10:00:00.000Z', 'en')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('sanitizeTimerName', () => {
  it('trims whitespace', () => {
    expect(sanitizeTimerName('  Fold laundry  ')).toBe('Fold laundry')
  })

  it('collapses an empty or whitespace-only name to null', () => {
    expect(sanitizeTimerName('')).toBeNull()
    expect(sanitizeTimerName('   ')).toBeNull()
  })

  it('caps the length', () => {
    const tooLong = 'x'.repeat(MAX_TIMER_NAME_LENGTH + 20)
    expect(sanitizeTimerName(tooLong)).toHaveLength(MAX_TIMER_NAME_LENGTH)
  })
})

describe('createTimerId', () => {
  it('returns a non-empty string, unique across calls', () => {
    const first = createTimerId()
    const second = createTimerId()
    expect(typeof first).toBe('string')
    expect(first.length).toBeGreaterThan(0)
    expect(first).not.toBe(second)
  })
})

describe('getProgressFraction', () => {
  it('is 0 for an untouched timer', () => {
    expect(getProgressFraction(1500, 1500)).toBe(0)
  })

  it('is 1 once time is up', () => {
    expect(getProgressFraction(1500, 0)).toBe(1)
  })

  it('is proportional in between', () => {
    expect(getProgressFraction(100, 25)).toBeCloseTo(0.75)
  })

  it('never goes negative for a zero-length plan', () => {
    expect(getProgressFraction(0, 0)).toBe(0)
  })
})

const baseTimer: TimerInstance = {
  id: 't1',
  presetId: 'custom',
  name: null,
  plannedSeconds: 600,
  status: 'idle',
  remainingSeconds: 600,
  startedAt: null,
  endTimestampMs: null,
  taskLink: null,
}

describe('getActivePhase', () => {
  it('is null for a plain timer with no phases', () => {
    expect(getActivePhase(baseTimer)).toBeNull()
  })

  it('resolves the phase at phaseIndex for a Pomodoro timer', () => {
    const pomodoro: TimerInstance = {
      ...baseTimer,
      presetId: 'pomodoro-focus',
      phases: [
        { kind: 'focus', seconds: 1200 },
        { kind: 'break', seconds: 600 },
      ],
      phaseIndex: 1,
    }
    expect(getActivePhase(pomodoro)).toEqual({ kind: 'break', seconds: 600 })
  })

  it('defaults phaseIndex to 0 when unset', () => {
    const pomodoro: TimerInstance = {
      ...baseTimer,
      presetId: 'pomodoro-focus',
      phases: [{ kind: 'focus', seconds: 1200 }],
    }
    expect(getActivePhase(pomodoro)).toEqual({ kind: 'focus', seconds: 1200 })
  })
})

describe('getActivePresetId', () => {
  it("returns a plain timer's own presetId", () => {
    expect(getActivePresetId(baseTimer)).toBe('custom')
  })

  it('maps the active phase to pomodoro-focus/short-break for a Pomodoro timer', () => {
    const focusPhase: TimerInstance = {
      ...baseTimer,
      presetId: 'pomodoro-focus',
      phases: [
        { kind: 'focus', seconds: 1200 },
        { kind: 'break', seconds: 600 },
      ],
      phaseIndex: 0,
    }
    const breakPhase: TimerInstance = { ...focusPhase, phaseIndex: 1 }

    expect(getActivePresetId(focusPhase)).toBe('pomodoro-focus')
    expect(getActivePresetId(breakPhase)).toBe('short-break')
  })
})

describe('getPhaseTranslationKey', () => {
  it('namespaces a phase kind under timers.pomodoro.phase', () => {
    expect(getPhaseTranslationKey('focus')).toBe('timers.pomodoro.phase.focus')
    expect(getPhaseTranslationKey('break')).toBe('timers.pomodoro.phase.break')
  })
})

describe('addMinutesToTimerInstance', () => {
  it('extends both planned and remaining seconds by the same amount', () => {
    const running: TimerInstance = { ...baseTimer, status: 'running', remainingSeconds: 400 }
    const result = addMinutesToTimerInstance(running, 5)

    expect(result.plannedSeconds).toBe(600 + 5 * 60)
    expect(result.remainingSeconds).toBe(400 + 5 * 60)
  })

  it("pushes a running timer's end timestamp out by the same delta", () => {
    const running: TimerInstance = { ...baseTimer, status: 'running', endTimestampMs: 1_000_000 }
    const result = addMinutesToTimerInstance(running, 5)

    expect(result.endTimestampMs).toBe(1_000_000 + 5 * 60 * 1000)
  })

  it('leaves a paused timer without an end timestamp alone', () => {
    const paused: TimerInstance = { ...baseTimer, status: 'paused', endTimestampMs: null }
    const result = addMinutesToTimerInstance(paused, 5)

    expect(result.endTimestampMs).toBeNull()
    expect(result.plannedSeconds).toBe(600 + 5 * 60)
  })

  it("extends a Pomodoro timer's current phase too, leaving the other untouched", () => {
    const pomodoro: TimerInstance = {
      ...baseTimer,
      status: 'running',
      presetId: 'pomodoro-focus',
      phases: [
        { kind: 'focus', seconds: 1200 },
        { kind: 'break', seconds: 600 },
      ],
      phaseIndex: 0,
    }
    const result = addMinutesToTimerInstance(pomodoro, 5)

    expect(result.phases).toEqual([
      { kind: 'focus', seconds: 1200 + 5 * 60 },
      { kind: 'break', seconds: 600 },
    ])
  })

  it('is a no-op for zero (or negative) minutes', () => {
    const running: TimerInstance = { ...baseTimer, status: 'running' }
    expect(addMinutesToTimerInstance(running, 0)).toBe(running)
    expect(addMinutesToTimerInstance(running, -5)).toBe(running)
  })
})

function makeTask(overrides: Partial<TaskRecord> = {}): TaskRecord {
  return {
    id: 1,
    conversationId: null,
    title: 'Clean the kitchen',
    description: null,
    priority: 'medium',
    dueDate: null,
    createdAt: '2026-08-18T10:00:00.000Z',
    subtasks: [],
    ...overrides,
  }
}

describe('buildTaskLinkOptions', () => {
  it('offers a Task with no subtasks yet', () => {
    const options = buildTaskLinkOptions([makeTask()])
    expect(options).toEqual([
      { key: 'task-1', taskId: 1, subtaskId: null, label: 'Clean the kitchen' },
    ])
  })

  it('offers the Task plus one option per incomplete subtask, labeled "Task → Subtask"', () => {
    const task = makeTask({
      subtasks: [
        {
          id: 10,
          taskId: 1,
          title: 'Wash dishes',
          estimatedMinutes: 15,
          priority: 'medium',
          dueDate: null,
          completed: false,
          completedAt: null,
          timerStatus: 'idle',
          remainingSeconds: 900,
          timerEndAt: null,
          sortOrder: 0,
          createdAt: '2026-08-18T10:00:00.000Z',
        },
      ],
    })

    expect(buildTaskLinkOptions([task])).toEqual([
      { key: 'task-1', taskId: 1, subtaskId: null, label: 'Clean the kitchen' },
      { key: 'subtask-10', taskId: 1, subtaskId: 10, label: 'Clean the kitchen → Wash dishes' },
    ])
  })

  it('skips a completed subtask, keeping the still-incomplete one (and the Task itself)', () => {
    const task = makeTask({
      subtasks: [
        {
          id: 10,
          taskId: 1,
          title: 'Wash dishes',
          estimatedMinutes: 15,
          priority: 'medium',
          dueDate: null,
          completed: true,
          completedAt: '2026-08-18T11:00:00.000Z',
          timerStatus: 'idle',
          remainingSeconds: 0,
          timerEndAt: null,
          sortOrder: 0,
          createdAt: '2026-08-18T10:00:00.000Z',
        },
        {
          id: 11,
          taskId: 1,
          title: 'Take out the trash',
          estimatedMinutes: 5,
          priority: 'low',
          dueDate: null,
          completed: false,
          completedAt: null,
          timerStatus: 'idle',
          remainingSeconds: 300,
          timerEndAt: null,
          sortOrder: 1,
          createdAt: '2026-08-18T10:00:00.000Z',
        },
      ],
    })

    expect(buildTaskLinkOptions([task])).toEqual([
      { key: 'task-1', taskId: 1, subtaskId: null, label: 'Clean the kitchen' },
      {
        key: 'subtask-11',
        taskId: 1,
        subtaskId: 11,
        label: 'Clean the kitchen → Take out the trash',
      },
    ])
  })

  it('skips a Task whose every subtask is already completed', () => {
    const task = makeTask({
      subtasks: [
        {
          id: 10,
          taskId: 1,
          title: 'Wash dishes',
          estimatedMinutes: 15,
          priority: 'medium',
          dueDate: null,
          completed: true,
          completedAt: '2026-08-18T11:00:00.000Z',
          timerStatus: 'idle',
          remainingSeconds: 0,
          timerEndAt: null,
          sortOrder: 0,
          createdAt: '2026-08-18T10:00:00.000Z',
        },
      ],
    })

    expect(buildTaskLinkOptions([task])).toEqual([])
  })
})
