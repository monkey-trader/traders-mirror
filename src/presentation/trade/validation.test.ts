import { describe, it, expect } from 'vitest'
import { validateTrade, validateAll } from './validation'

describe('validateTrade', () => {
  it('returns errors for missing fields', () => {
    const errors = validateTrade({ id: '', symbol: '', entryDate: '', size: 0, price: 0, side: '' })
    expect(errors.symbol).toBe('Symbol erforderlich')
    expect(errors.entryDate).toBe('Datum erforderlich')
    expect(errors.size).toBe('Größe muss positiv sein')
    expect(errors.price).toBe('Preis muss positiv sein')
    expect(errors.side).toBe("Side muss 'LONG' oder 'SHORT' sein")
  })
  it('returns error for invalid side', () => {
    const errors = validateTrade({ id: '1', symbol: 'AAPL', entryDate: '2023-01-01T00:00:00Z', size: 1, price: 100, side: 'foo' })
    expect(errors.side).toBe("Side muss 'LONG' oder 'SHORT' sein")
  })
  it('returns no errors for valid input', () => {
    const errors = validateTrade({ id: '1', symbol: 'AAPL', entryDate: '2023-01-01T00:00:00Z', size: 1, price: 100, side: 'LONG' })
    expect(Object.values(errors).every(e => !e)).toBe(true)
  })
})

describe('validateAll', () => {
  it('returns errors for multiple trades', () => {
    const errors = validateAll([
      { id: '1', symbol: '', entryDate: '', size: 0, price: 0, side: '' },
      { id: '2', symbol: 'AAPL', entryDate: '2023-01-01T00:00:00Z', size: 1, price: 100, side: 'SHORT' }
    ])
    expect(errors['1'].symbol).toBe('Symbol erforderlich')
    expect(errors['1'].side).toBe("Side muss 'LONG' oder 'SHORT' sein")
    expect(Object.values(errors['2']).every(e => !e)).toBe(true)
  })
})
