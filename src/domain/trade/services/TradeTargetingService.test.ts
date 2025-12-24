import { describe, it, expect } from 'vitest'
import { TradeTargetingService } from './TradeTargetingService'

const baseTrade = (overrides: any = {}) => ({
  symbol: 'AAPL',
  entryDate: '2025-01-01T00:00:00Z',
  size: 1,
  price: 100,
  side: 'LONG',
  targets: [] as any[],
  ...overrides,
})

describe('TradeTargetingService', () => {
  it('assessBreakEvenCandidate returns false when no stop loss', () => {
    const trade = baseTrade()
    const res = TradeTargetingService.assessBreakEvenCandidate(trade as any, 150)
    expect(res.canMoveToBreakEven).toBe(false)
  })

  it('assessBreakEvenCandidate identifies threshold for LONG', () => {
    // entry 100, stop 90 => dist=10 => threshold = 100 + 2*10 = 120
    const trade = baseTrade({ targets: [{ kind: 'STOP_LOSS', price: 90, status: 'OPEN' }] })
    const res1 = TradeTargetingService.assessBreakEvenCandidate(trade as any, 119)
    expect(res1.canMoveToBreakEven).toBe(false)
    const res2 = TradeTargetingService.assessBreakEvenCandidate(trade as any, 120)
    expect(res2.canMoveToBreakEven).toBe(true)
  })

  it('applyMoveStopToBreakEven mutates trade and returns event', () => {
    const trade = baseTrade({ targets: [{ id: 'sl1', kind: 'STOP_LOSS', price: 90, status: 'OPEN' }] })
    const ev = TradeTargetingService.applyMoveStopToBreakEven(trade as any)
    expect(ev).not.toBeNull()
    expect(trade.targets?.[0].kind).toBe('BREAK_EVEN')
    expect(trade.targets?.[0].price).toBe(100)
  })

  it('applyMoveStopToBreakEven is noop when already BE', () => {
    const trade = baseTrade({ targets: [{ id: 'sl1', kind: 'BREAK_EVEN', price: 100, status: 'OPEN' }] })
    const ev = TradeTargetingService.applyMoveStopToBreakEven(trade as any)
    expect(ev).toBeNull()
  })
})

