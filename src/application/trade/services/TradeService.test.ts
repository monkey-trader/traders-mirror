import { TradeService } from './TradeService'
import { InMemoryTradeRepository } from '../../../infrastructure/trade/repositories/InMemoryTradeRepository'

describe('TradeService', () => {
  test('listTrades returns empty initially and after adding a trade contains it', async () => {
    const repo = new InMemoryTradeRepository()
    const svc = new TradeService(repo)

    const initial = await svc.listTrades()
    expect(Array.isArray(initial)).toBe(true)
    expect(initial.length).toBe(0)

    await svc.addTrade('AAPL', '2025-12-22T10:00', 2, 200.5, 'note')

    const after = await svc.listTrades()
    expect(after.length).toBe(1)
    const t = after[0]
    expect(t.symbol).toBe('AAPL')
    expect(t.size).toBe(2)
    expect(t.price).toBe(200.5)
    expect(t.notes).toBe('note')
  })

  test('addTrade throws when underlying entity validation fails', async () => {
    const repo = new InMemoryTradeRepository()
    const svc = new TradeService(repo)

    await expect(svc.addTrade('', '2025-12-22T10:00', 1, 100)).rejects.toThrow()
    await expect(svc.listTrades()).resolves.toHaveLength(0)
  })
})
