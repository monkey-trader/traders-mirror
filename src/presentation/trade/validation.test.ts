import { describe, it, expect } from 'vitest'
import { validateNewTrade } from './validation'

describe('validateNewTrade', () => {
  it('returns no errors for a valid input', () => {
    const input = {
      symbol: 'AAPL',
      entryDate: new Date().toISOString(),
      size: 1,
      price: 100,
      side: 'LONG',
      market: 'Crypto',
      sl: 10,
      margin: 100,
      leverage: 2
    }
    const errors = validateNewTrade(input as any)
    expect(errors).toEqual([])
  })

  it('returns market error when market empty', () => {
    const input = {
      symbol: 'AAPL',
      entryDate: new Date().toISOString(),
      size: 1,
      price: 100,
      side: 'LONG',
      market: ''
    }
    const errors = validateNewTrade(input as any)
    expect(errors.some(e => e && e.field === 'market')).toBeTruthy()
  })

  it('returns size and price errors for invalid numbers', () => {
    const input = {
      symbol: 'AAPL',
      entryDate: new Date().toISOString(),
      size: 0,
      price: -1,
      side: 'LONG',
      market: 'Forex'
    }
    const errors = validateNewTrade(input as any)
    expect(errors.some(e => e && e.field === 'size')).toBeTruthy()
    expect(errors.some(e => e && e.field === 'price')).toBeTruthy()
  })

  it('returns errors when sl/margin/leverage missing', () => {
    const input = {
      symbol: 'AAPL',
      entryDate: new Date().toISOString(),
      size: 1,
      price: 100,
      side: 'LONG',
      market: 'Crypto'
    }
    const errors = validateNewTrade(input as any)
    expect(errors.some(e => e && e.field === 'sl')).toBeTruthy()
    expect(errors.some(e => e && e.field === 'margin')).toBeTruthy()
    expect(errors.some(e => e && e.field === 'leverage')).toBeTruthy()
  })
})
