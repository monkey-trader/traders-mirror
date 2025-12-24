import { describe, it, expect } from 'vitest'
import { computeTradeOutcome } from './tradeOutcome'

const baseTrade = (overrides: any = {}) => ({
  symbol: 'AAPL',
  entryDate: '2025-01-01T00:00:00Z',
  size: 1,
  price: 100,
  side: 'LONG',
  targets: [] as any[],
  ...overrides,
})

describe('computeTradeOutcome', () => {
  it('reports WIN when BE present and treatBreakEvenAsWin=true', () => {
    const trade = baseTrade({ targets: [{ kind: 'BREAK_EVEN', price: 100, status: 'OPEN' }] })
    const res = computeTradeOutcome(trade as any, { treatBreakEvenAsWin: true })
    expect(res.outcome).toBe('WIN')
  })

  it('reports PENDING when BE present but treatBreakEvenAsWin=false', () => {
    const trade = baseTrade({ targets: [{ kind: 'BREAK_EVEN', price: 100, status: 'OPEN' }] })
    const res = computeTradeOutcome(trade as any, { treatBreakEvenAsWin: false })
    expect(res.outcome).toBe('PENDING')
  })

  it('reports WIN when TP executed for full size', () => {
    const trade = baseTrade({ targets: [{ kind: 'TAKE_PROFIT', price: 120, status: 'TRIGGERED', executedPrice: 120, size: 1 }] })
    const res = computeTradeOutcome(trade as any)
    expect(res.outcome).toBe('WIN')
    expect(res.realizedPL).toBeCloseTo(20)
  })

  it('reports PENDING for partial TP', () => {
    const trade = baseTrade({ targets: [{ kind: 'TAKE_PROFIT', price: 120, status: 'TRIGGERED', executedPrice: 120, size: 0.4 }] })
    const res = computeTradeOutcome(trade as any)
    expect(res.outcome).toBe('PENDING')
    expect(res.realizedPL).toBeCloseTo(8)
    expect(res.remainingSize).toBeCloseTo(0.6)
  })

  it('reports LOSS when later SL closes remaining size', () => {
    const trade = baseTrade({ targets: [
      { kind: 'BREAK_EVEN', price: 100, status: 'OPEN' },
      { kind: 'STOP_LOSS', price: 95, status: 'TRIGGERED', executedPrice: 95, size: 1 }
    ] })
    const res = computeTradeOutcome(trade as any)
    // fully closed by SL with realizedPL = (95-100)*1 = -5
    expect(res.outcome).toBe('LOSS')
    expect(res.realizedPL).toBeCloseTo(-5)
  })
})

