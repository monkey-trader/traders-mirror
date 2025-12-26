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
})
