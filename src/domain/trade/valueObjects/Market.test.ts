import { describe, it, expect } from 'vitest'
import { Market } from './Market'

describe('Market VO', () => {
  it('normalizes forex and crypto', () => {
    expect(new Market('forex').value).toBe('Forex')
    expect(new Market('CRYPTO').value).toBe('Crypto')
  })

  it('throws on invalid market', () => {
    expect(() => new Market('stocks' as any)).toThrow()
  })
})

