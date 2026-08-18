import { describe, expect, it } from 'vitest'
import {
  clampCustomMinutes,
  clampMinutes,
  computeRemainingSeconds,
  createTimerId,
  formatSeconds,
  formatSessionTimestamp,
  getPresetDefaultMinutes,
  getPresetTranslationKey,
  getProgressFraction,
  sanitizeTimerName,
} from './TimersTab.utils'
import { DEFAULT_CUSTOM_MINUTES, MAX_TIMER_NAME_LENGTH } from './TimersTab.constants'

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
    expect(getPresetDefaultMinutes('pomodoro-focus')).toBe(25)
    expect(getPresetDefaultMinutes('short-break')).toBe(5)
    expect(getPresetDefaultMinutes('long-break')).toBe(15)
  })

  it('falls back to DEFAULT_CUSTOM_MINUTES for custom', () => {
    expect(getPresetDefaultMinutes('custom')).toBe(DEFAULT_CUSTOM_MINUTES)
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
