import { describe, it, expect } from 'vitest'
import { validateAll } from './validation'

describe('presentation/trade/validation', () => {
  it('returns no errors for a valid form', () => {
    const form = { symbol: 'AAPL', entryDate: new Date().toISOString(), size: 1, price: 100, notes: '' }
    const errors = validateAll(form)
    expect(Object.values(errors).some(Boolean)).toBe(false)
  })

  it('validates required fields and numeric constraints', () => {
    const now = new Date().toISOString()
    let errors = validateAll({ symbol: '', entryDate: '', size: 0, price: 0, notes: '' })
    expect(errors.symbol).toBeDefined()
    expect(errors.entryDate).toBeDefined()
    expect(errors.size).toBeDefined()
    expect(errors.price).toBeDefined()

    errors = validateAll({ symbol: 'X', entryDate: 'invalid-date', size: -1, price: -5, notes: '' })
    expect(errors.entryDate).toBeDefined()
    expect(errors.size).toBeDefined()
    expect(errors.price).toBeDefined()

    errors = validateAll({ symbol: 'X', entryDate: now, size: 2, price: 10, notes: '' })
    expect(Object.values(errors).some(Boolean)).toBe(false)
  })
})

