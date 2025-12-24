import { describe, it, expect } from 'vitest'
import { TradeFactory } from './TradeFactory'
import { Trade } from '../entities/Trade'
import { TradeSymbol } from '../value-objects/TradeSymbol'
import { EntryDate } from '../value-objects/EntryDate'
import { Price } from '../value-objects/Price'
import { Size } from '../value-objects/Size'
import { TradeStatus } from '../value-objects/TradeStatus'
import { TradeTarget } from '@/domain/trade/value-objects/TradeTarget'

describe('TradeFactory', () => {
  it('creates Trade from primitives and targets primitives', () => {
    const input = {
      symbol: 'AAPL',
      entryDate: '2025-01-01T00:00:00Z',
      size: 1,
      price: 100,
      targets: [
        { kind: 'TAKE_PROFIT', rank: 1, price: 120 },
        { kind: 'STOP_LOSS', price: 90 },
      ],
    }

    const trade = TradeFactory.create(input as any)
    expect(trade.symbol).toBe('AAPL')
    expect(trade.targets).toBeDefined()
    expect(trade.targets?.length).toBe(2)
    expect(trade.targets?.[0].kind).toBe('TAKE_PROFIT')
  })

  it('accepts TradeTarget instances and normalizes primitives', () => {
    const tp = new TradeTarget({ kind: 'TAKE_PROFIT', rank: 1, price: 120 })
    const sl = new TradeTarget({ kind: 'STOP_LOSS', price: 90 })
    const input = { symbol: 'AAPL', entryDate: '2025-01-01T00:00:00Z', size: 1, price: 100, targets: [tp, sl] }
    const trade = TradeFactory.create(input as any)
    expect(trade.targets).toBeDefined()
    expect(trade.targets?.[0].kind).toBe('TAKE_PROFIT')
  })

  it('accepts legacy legs alias', () => {
    const input = {
      symbol: 'AAPL',
      entryDate: '2025-01-01T00:00:00Z',
      size: 1,
      price: 100,
      legs: [{ kind: 'TAKE_PROFIT', rank: 1, price: 120 }],
    }
    const trade = TradeFactory.create(input as any)
    expect(trade.targets).toBeDefined()
    expect(trade.targets?.[0].kind).toBe('TAKE_PROFIT')
  })

  test('creates Trade from VOs', () => {
    const t = TradeFactory.create({
      symbol: new TradeSymbol('msft'),
      entryDate: new EntryDate('2025-12-22T10:00'),
      size: new Size(3),
      price: new Price(300.5),
      notes: 'vo',
      status: new TradeStatus('PENDING')
    })
    expect(t).toBeInstanceOf(Trade)
    expect(t.symbol).toBe('MSFT')
    expect(t.size).toBe(3)
    expect(t.price).toBe(300.5)
    expect(t.status).toBe('PENDING')
  })

  test('throws when validation fails', () => {
    expect(() => TradeFactory.create({ symbol: '', entryDate: 'invalid', size: 0, price: 0 })).toThrow()
  })
})
