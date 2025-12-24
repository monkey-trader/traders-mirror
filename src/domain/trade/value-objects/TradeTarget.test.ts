import { describe, it, expect } from 'vitest'
import { TradeTarget, TradeTargetDTO, TradeTargetKindInvalidError, TradeTargetPriceInvalidError, TradeTargetRankInvalidError } from './TradeTarget'

describe('TradeTarget VO', () => {
  it('creates a valid TAKE_PROFIT target', () => {
    const dto: TradeTargetDTO = { kind: 'TAKE_PROFIT', rank: 1, price: 100 }
    const vo = new TradeTarget(dto)
    expect(vo.kind).toBe('TAKE_PROFIT')
    expect(vo.rank).toBe(1)
    expect(vo.price).toBe(100)
    expect(vo.status).toBe('OPEN')
  })

  it('throws for invalid kind', () => {
    // @ts-expect-error testing invalid kind
    expect(() => new TradeTarget({ kind: 'INVALID', price: 10 })).toThrow(TradeTargetKindInvalidError)
  })

  it('throws for non-positive price', () => {
    expect(() => new TradeTarget({ kind: 'STOP_LOSS', price: 0 })).toThrow(TradeTargetPriceInvalidError)
  })

  it('throws for invalid rank for TAKE_PROFIT', () => {
    expect(() => new TradeTarget({ kind: 'TAKE_PROFIT', rank: 0 as any, price: 50 })).toThrow(TradeTargetRankInvalidError)
  })

  it('can be marked as triggered', () => {
    const dto: TradeTargetDTO = { kind: 'TAKE_PROFIT', rank: 1, price: 100 }
    const vo = new TradeTarget(dto)
    vo.markTriggered(100, '2025-12-24T00:00:00Z')
    expect(vo.status).toBe('TRIGGERED')
    expect(vo.executedPrice).toBe(100)
    expect(vo.executedAt).toBe('2025-12-24T00:00:00Z')
  })
})

