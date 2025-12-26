import { describe, it, expect } from 'vitest'
import { EntryDate, EntryDateInvalidError } from './EntryDate'

describe('EntryDate VO helpers', () => {
  it('toInputValue returns a datetime-local string parseable by Date', () => {
    const s = EntryDate.toInputValue()
    expect(typeof s).toBe('string')
    const parsed = new Date(s)
    // parsed should be valid date
    expect(isNaN(parsed.getTime())).toBe(false)
    // format should contain 'T' between date and time
    expect(s).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)
  })

  it('toInputValue(iso) and fromInputValue roundtrip', () => {
    const iso = new Date('2025-12-26T14:30:00Z').toISOString()
    const input = EntryDate.toInputValue(iso)
    const back = EntryDate.fromInputValue(input)
    expect(new Date(back).toISOString()).toBe(new Date(input).toISOString())
  })

  it('fromInputValue throws EntryDateInvalidError for invalid input', () => {
    expect(() => EntryDate.fromInputValue('not-a-date')).toThrow(EntryDateInvalidError)
    expect(() => EntryDate.fromInputValue('')).toThrow(EntryDateInvalidError)
  })
})

