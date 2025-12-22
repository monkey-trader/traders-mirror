import { describe, test, expect } from 'vitest'
import { TradeFactory } from './TradeFactory'
import { Trade } from '../entities/Trade'
import { TradeSymbol } from '../value-objects/TradeSymbol'
import { EntryDate } from '../value-objects/EntryDate'
import { Price } from '../value-objects/Price'
import { Size } from '../value-objects/Size'

describe('TradeFactory', () => {
  test('creates Trade from primitives', () => {
    const t = TradeFactory.create({ symbol: 'AAPL', entryDate: '2025-12-22T10:00', size: 1, price: 100, notes: 'x' })
    expect(t).toBeInstanceOf(Trade)
    expect(t.symbol).toBe('AAPL')
  })

  test('creates Trade from VOs', () => {
    const t = TradeFactory.create({
      symbol: new TradeSymbol('msft'),
      entryDate: new EntryDate('2025-12-22T10:00'),
      size: new Size(3),
      price: new Price(300.5),
      notes: 'vo'
    })
    expect(t).toBeInstanceOf(Trade)
    expect(t.symbol).toBe('MSFT')
    expect(t.size).toBe(3)
    expect(t.price).toBe(300.5)
  })

  test('throws when validation fails', () => {
    expect(() => TradeFactory.create({ symbol: '', entryDate: 'invalid', size: 0, price: 0 })).toThrow()
  })
})

