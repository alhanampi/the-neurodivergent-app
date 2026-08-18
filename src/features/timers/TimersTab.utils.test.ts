import { describe, expect, it } from 'vitest'
import {
  clampCustomMinutes,
  computeRemainingSeconds,
  createTimerId,
  formatSeconds,
  formatSessionTimestamp,
  getPlannedSeconds,
  getPresetTranslationKey,
  getProgressFraction,
  sanitizeTimerName,
} from './TimersTab.utils'
import { MAX_TIMER_NAME_LENGTH } from './TimersTab.constants'

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

describe('getPlannedSeconds', () => {
  it('resolves a known preset to its fixed duration', () => {
    expect(getPlannedSeconds('pomodoro-focus', 999)).toBe(25 * 60)
    expect(getPlannedSeconds('short-break', 999)).toBe(5 * 60)
    expect(getPlannedSeconds('long-break', 999)).toBe(15 * 60)
  })

  it('resolves custom to the clamped custom minutes', () => {
    expect(getPlannedSeconds('custom', 12)).toBe(12 * 60)
    expect(getPlannedSeconds('custom', 0)).toBe(60)
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
