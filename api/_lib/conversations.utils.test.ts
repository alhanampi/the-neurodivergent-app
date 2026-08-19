import { describe, expect, it } from 'vitest'
import { parseRenameBody } from './conversations.utils.js'

describe('parseRenameBody', () => {
  it('accepts a well-formed title', () => {
    expect(parseRenameBody({ title: 'Weekly planning' })).toEqual({ title: 'Weekly planning' })
  })

  it('trims the title', () => {
    expect(parseRenameBody({ title: '  Weekly planning  ' })).toEqual({
      title: 'Weekly planning',
    })
  })

  it('rejects an empty or whitespace-only title', () => {
    expect(parseRenameBody({ title: '' })).toBeNull()
    expect(parseRenameBody({ title: '   ' })).toBeNull()
  })

  it('rejects a title over 120 characters', () => {
    expect(parseRenameBody({ title: 'x'.repeat(121) })).toBeNull()
  })

  it('rejects a non-string title', () => {
    expect(parseRenameBody({ title: 42 })).toBeNull()
  })

  it('rejects non-object input', () => {
    expect(parseRenameBody(null)).toBeNull()
    expect(parseRenameBody('nope')).toBeNull()
  })
})
