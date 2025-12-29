import { describe, it, expect, beforeEach } from 'vitest'
import LocalStorageTradeRepository from '@/infrastructure/trade/repositories/LocalStorageTradeRepository'
import { TradeFactory } from '@/domain/trade/entities/TradeFactory'

beforeEach(() => {
  if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.clear === 'function') {
    window.localStorage.clear()
  }
})

describe('LocalStorageTradeRepository', () => {
  it('saves and retrieves a trade', async () => {
    const repo = new LocalStorageTradeRepository('test_key', { seedDefaults: false })
    const trade = TradeFactory.create({ id: 't1', symbol: 'BTCUSD', size: 1, price: 1000, side: 'LONG' })
    await repo.save(trade)
    const all = await repo.getAll()
    expect(all.length).toBe(1)
    expect(all[0].id).toBe('t1')
    expect(all[0].symbol.value).toBe('BTCUSD')
    expect(all[0].size.value).toBe(1)
    expect(all[0].price.value).toBe(1000)
  })

  it('updates an existing trade', async () => {
    const repo = new LocalStorageTradeRepository('test_key2', { seedDefaults: false })
    const trade = TradeFactory.create({ id: 't2', symbol: 'ETHUSD', size: 0.5, price: 200, side: 'SHORT' })
    await repo.save(trade)

    const updated = TradeFactory.create({ id: 't2', symbol: 'ETHUSD', size: 1.5, price: 210, side: 'SHORT', notes: 'updated' })
    await repo.update(updated)

    const all = await repo.getAll()
    expect(all.length).toBe(1)
    expect(all[0].id).toBe('t2')
    expect(all[0].size.value).toBe(1.5)
    expect(all[0].price.value).toBe(210)
    expect(all[0].notes).toBe('updated')
  })

  it('delete removes a trade', async () => {
    const repo = new LocalStorageTradeRepository('test_key3', { seedDefaults: false })
    const trade = TradeFactory.create({ id: 't3', symbol: 'XRPUSD', size: 10, price: 0.5, side: 'LONG' })
    await repo.save(trade)
    let all = await repo.getAll()
    expect(all.length).toBe(1)

    await repo.delete('t3')
    all = await repo.getAll()
    expect(all.length).toBe(0)
  })

  it('seed accepts RepoTrade[] and persists them', async () => {
    const repo = new LocalStorageTradeRepository('test_seed', { seedDefaults: false })
    const seedTrade = {
      id: 's1', market: 'All', symbol: 'SEED', entryDate: new Date().toISOString(), size: 2, price: 5, side: 'LONG', status: 'OPEN', pnl: 0
    }
    // @ts-expect-error test: passing raw repo shape
    repo.seed([seedTrade])
    const all = await repo.getAll()
    expect(all.length).toBe(1)
    expect(all[0].id).toBe('s1')
    expect(all[0].symbol.value).toBe('SEED')
  })

  it('update on non-existing performs save', async () => {
    const repo = new LocalStorageTradeRepository('test_key4', { seedDefaults: false })
    const trade = TradeFactory.create({ id: 't4', symbol: 'AAA', size: 1, price: 1, side: 'LONG' })
    await repo.update(trade) // should save when not present
    const all = await repo.getAll()
    expect(all.length).toBe(1)
    expect(all[0].id).toBe('t4')
  })
})

