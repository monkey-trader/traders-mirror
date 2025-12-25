import { describe, it, expect } from 'vitest'
import { validateSuggestion } from './validation'

describe('analysis validation', () => {
  it('returns error for missing symbol', () => {
    const res = validateSuggestion({ symbol: '', price: 1 } as any)
    expect(res.length).toBeGreaterThan(0)
    expect(res.some(r => r?.field === 'symbol')).toBeTruthy()
  })

  it('returns error for invalid price', () => {
    const res = validateSuggestion({ symbol: 'EURUSD', price: 0 } as any)
    expect(res.some(r => r?.field === 'price')).toBeTruthy()
  })

  it('passes for valid suggestion', () => {
    const res = validateSuggestion({ symbol: 'BTCUSD', price: 42000, size: 0.01, side: 'SHORT' } as any)
    expect(res.length).toBe(0)
  })
})

