import { describe, expect, it } from 'vitest'
import {
  clampCustomMinutes,
  computeRemainingSeconds,
  formatSeconds,
  formatSessionTimestamp,
  getPlannedSeconds,
  getPresetTranslationKey,
} from './TimersTab.utils'

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
