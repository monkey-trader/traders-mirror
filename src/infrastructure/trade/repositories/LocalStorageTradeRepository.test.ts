// Ensure localStorage exists in the test environment (jsdom sometimes lacks a full implementation)
function createLocalStorageMock() {
  let store: Record<string, string> = {}
  return {
    getItem(key: string) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null },
    setItem(key: string, value: string) { store[key] = String(value) },
    removeItem(key: string) { delete store[key] },
    clear() { store = {} }
  }
}

if (!window.localStorage || typeof window.localStorage.getItem !== 'function') {
  // @ts-ignore - assign mock via defineProperty to avoid readonly errors
  Object.defineProperty(window, 'localStorage', { value: createLocalStorageMock(), configurable: true })
}

import { describe, it, beforeEach, afterEach, expect } from 'vitest'
import LocalStorageTradeRepository from './LocalStorageTradeRepository'
import { TradeFactory } from '@/domain/trade/entities/TradeFactory'

const TEST_KEY = 'mt_trades_test'

describe('LocalStorageTradeRepository', () => {
  beforeEach(() => {
    window.localStorage.removeItem(TEST_KEY)
  })

  afterEach(() => {
    window.localStorage.removeItem(TEST_KEY)
  })

  it('saves and retrieves trades', async () => {
    const repo = new LocalStorageTradeRepository(TEST_KEY)
    const t = TradeFactory.create({ id: 'u1', symbol: 'BTCUSD', entryDate: new Date().toISOString(), size: 1, price: 100, side: 'LONG' })
    await repo.save(t)
    const all = await repo.getAll()
    expect(all.find(a => a.id === 'u1')).toBeDefined()
  })

  it('updates existing trade', async () => {
    const repo = new LocalStorageTradeRepository(TEST_KEY)
    const t = TradeFactory.create({ id: 'u2', symbol: 'ETHUSD', entryDate: new Date().toISOString(), size: 2, price: 200, side: 'SHORT' })
    await repo.save(t)
    const updated = TradeFactory.create({ id: 'u2', symbol: 'ETHUSD', entryDate: new Date().toISOString(), size: 3, price: 210, side: 'SHORT' })
    await repo.update(updated)
    const all = await repo.getAll()
    const found = all.find(a => a.id === 'u2')
    expect(found).toBeDefined()
    expect(found?.size.value).toBe(3)
  })

  it('constructor loads from existing localStorage data', async () => {
    // prepare raw storage with one repo trade
    const raw = JSON.stringify([{ id: 'x1', symbol: 'LOADUSD', entryDate: new Date().toISOString(), size: 1, price: 1, side: 'LONG', market: 'All', status: 'OPEN', pnl: 0 }])
    window.localStorage.setItem(TEST_KEY, raw)
    const repo = new LocalStorageTradeRepository(TEST_KEY)
    const all = await repo.getAll()
    expect(all.find(a => a.id === 'x1')).toBeDefined()
  })

  it('seedDefaults=false starts empty and seed() persists', async () => {
    const repo = new LocalStorageTradeRepository(TEST_KEY, { seedDefaults: false })
    let all = await repo.getAll()
    expect(all.length).toBe(0)
    repo.seed([{ id: 's1', symbol: 'SUSD', entryDate: new Date().toISOString(), size: 1, price: 1, side: 'LONG', market: 'All', status: 'OPEN', pnl: 0 }])
    all = await repo.getAll()
    expect(all.find(a => a.id === 's1')).toBeDefined()
  })

  it('update falls back to save when id not found', async () => {
    const repo = new LocalStorageTradeRepository(TEST_KEY, { seedDefaults: false })
    const t = TradeFactory.create({ id: 'new-missing', symbol: 'NEWUSD', entryDate: new Date().toISOString(), size: 1, price: 1, side: 'LONG' })
    // update should perform save when not existing
    await repo.update(t)
    const all = await repo.getAll()
    expect(all.find(a => a.id === 'new-missing')).toBeDefined()
  })

  it('delete removes existing trade', async () => {
    const repo = new LocalStorageTradeRepository(TEST_KEY)
    const t = TradeFactory.create({ id: 'd1', symbol: 'DELUSD', entryDate: new Date().toISOString(), size: 1, price: 1, side: 'LONG' })
    await repo.save(t)
    await repo.delete('d1')
    const all = await repo.getAll()
    expect(all.find(a => a.id === 'd1')).toBeUndefined()
  })
})
