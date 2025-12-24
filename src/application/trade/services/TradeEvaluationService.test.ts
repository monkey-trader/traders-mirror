import { describe, it, expect } from 'vitest'
import { TradeEvaluationService } from './TradeEvaluationService'

class InMemoryRepo {
  private trades: any[] = []
  async save(t: any) { const found = this.trades.findIndex((x) => x === t); if (found === -1) this.trades.push(t); else this.trades[found] = t }
  async getAll() { return [...this.trades] }
  add(t: any) { this.trades.push(t) }
}

describe('TradeEvaluationService', () => {
  it('onMarketTick returns candidate when BE threshold met', async () => {
    const repo = new InMemoryRepo()
    const trade = { symbol: 'AAPL', price: 100, size: 1, targets: [{ kind: 'STOP_LOSS', price: 90, status: 'OPEN' }], side: 'LONG' }
    repo.add(trade)
    const svc = new TradeEvaluationService(repo as any, { moveStopToBreakEvenMultiplier: 2 })
    const res = await svc.onMarketTick('AAPL', 120)
    expect(res.length).toBe(1)
    expect(res[0].trade).toBe(trade)
  })

  it('moveStopToBreakEven persists change', async () => {
    const repo = new InMemoryRepo()
    const trade = { symbol: 'AAPL', price: 100, size: 1, targets: [{ id: 'sl1', kind: 'STOP_LOSS', price: 90, status: 'OPEN' }], side: 'LONG' }
    repo.add(trade)
    const svc = new TradeEvaluationService(repo as any)
    const ev = await svc.moveStopToBreakEven(trade as any, 'sl1')
    expect(ev).not.toBeNull()
    const saved = await repo.getAll()
    expect(saved[0].targets[0].kind).toBe('BREAK_EVEN')
  })
})

