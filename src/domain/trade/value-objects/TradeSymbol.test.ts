import { describe, test, expect } from 'vitest'
import { TradeSymbol } from './TradeSymbol'

describe('TradeSymbol VO', () => {
  test('accepts and normalizes valid symbol', () => {
    const tradeSymbol = new TradeSymbol(' aapl ')
    expect(tradeSymbol.toString()).toBe('AAPL')
  })

  test('throws for empty symbol', () => {
    expect(() => new TradeSymbol('')).toThrow('Symbol required')
  })

  test('throws for too long symbol', () => {
    expect(() => new TradeSymbol('ABCDEFGHIJK')).toThrow('Symbol too long')
  })
})

