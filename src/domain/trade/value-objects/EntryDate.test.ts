import { describe, test, expect } from 'vitest'
import { EntryDate } from './EntryDate'

describe('EntryDate VO', () => {
  test('accepts ISO string and stores normalized ISO', () => {
    const d = new EntryDate('2025-12-22T10:00')
    expect(d.toString()).toBe(new Date('2025-12-22T10:00').toISOString())
  })

  test('throws for invalid date', () => {
    expect(() => new EntryDate('invalid')).toThrow('Entry date required')
  })
})

