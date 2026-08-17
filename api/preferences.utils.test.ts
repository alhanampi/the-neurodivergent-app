import { describe, expect, it } from 'vitest'
import { isSupportedLanguage } from './preferences.utils'

describe('isSupportedLanguage', () => {
  it('accepts en and es', () => {
    expect(isSupportedLanguage('en')).toBe(true)
    expect(isSupportedLanguage('es')).toBe(true)
  })

  it('rejects anything else, including non-strings', () => {
    expect(isSupportedLanguage('fr')).toBe(false)
    expect(isSupportedLanguage(undefined)).toBe(false)
    expect(isSupportedLanguage(null)).toBe(false)
    expect(isSupportedLanguage(42)).toBe(false)
  })
})
