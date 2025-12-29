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

  // --- additional tests added below ---

  it('constructor seeds defaults when storage empty', async () => {
    const key = 'test_defaults'
    // ensure no data in localStorage
    window.localStorage.removeItem(key)
    const repo = new LocalStorageTradeRepository(key)
    const all = await repo.getAll()
    expect(all.length).toBeGreaterThan(0)
    // default mock has id 't1'
    expect(all.some(t => t.id === 't1')).toBe(true)
  })

  it('constructor does not seed when seedDefaults=false', async () => {
    const key = 'test_no_defaults'
    window.localStorage.removeItem(key)
    const repo = new LocalStorageTradeRepository(key, { seedDefaults: false })
    const all = await repo.getAll()
    expect(all.length).toBe(0)
  })

  it('falls back to defaults when localStorage contains malformed JSON', async () => {
    const key = 'test_malformed'
    window.localStorage.setItem(key, 'not-a-json')
    const repo = new LocalStorageTradeRepository(key)
    const all = await repo.getAll()
    // should have seeded defaults in catch
    expect(all.length).toBeGreaterThan(0)
  })

  it('save persists trade to localStorage', async () => {
    const key = 'test_persist'
    window.localStorage.removeItem(key)
    const repo = new LocalStorageTradeRepository(key, { seedDefaults: false })
    const trade = TradeFactory.create({ id: 'p1', symbol: 'SAVE', size: 3, price: 10, side: 'LONG' })
    await repo.save(trade)
    const raw = window.localStorage.getItem(key)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw as string)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed.find((r: any) => r.id === 'p1')).toBeTruthy()
  })

  it('seed prepends new trades (order preserved)', async () => {
    const key = 'test_seed_order'
    window.localStorage.removeItem(key)
    const repo = new LocalStorageTradeRepository(key, { seedDefaults: false })
    const seedA = { id: 'a1', market: 'All', symbol: 'A', entryDate: new Date().toISOString(), size: 1, price: 1, side: 'LONG', status: 'OPEN', pnl: 0 }
    const seedB = { id: 'b1', market: 'All', symbol: 'B', entryDate: new Date().toISOString(), size: 1, price: 2, side: 'LONG', status: 'OPEN', pnl: 0 }
    // @ts-expect-error passing raw repo shapes
    repo.seed([seedA])
    // @ts-expect-error
    repo.seed([seedB])
    const raw = window.localStorage.getItem(key) as string
    const parsed = JSON.parse(raw)
    // seedB should be first element because seed prepends
    expect(parsed[0].id).toBe('b1')
    expect(parsed[1].id).toBe('a1')
  })

  it('seed is no-op for invalid input', async () => {
    const key = 'test_seed_noop'
    window.localStorage.removeItem(key)
    const repo = new LocalStorageTradeRepository(key, { seedDefaults: false })
    // @ts-expect-error pass invalid
    repo.seed(undefined)
    // @ts-expect-error
    repo.seed([])
    const raw = window.localStorage.getItem(key)
    expect(raw).toBeNull()
  })

})
