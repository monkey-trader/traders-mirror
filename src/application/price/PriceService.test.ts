import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PriceService } from './PriceService'
import type { PriceRepository, CryptoPrice } from '@/domain/price/interfaces/PriceRepository'

class MockRepo implements PriceRepository {
  calls = 0
  async getCryptoPrice(idOrSymbol: string, vsCurrency = 'usd'): Promise<CryptoPrice> {
    this.calls++
    return { price: 100 + this.calls, ts: Date.now(), currency: vsCurrency }
  }
}

describe('PriceService', () => {
  let repo: MockRepo
  let svc: PriceService

  beforeEach(() => {
    repo = new MockRepo()
    svc = new PriceService(repo, 1000) // 1s ttl for tests
  })

  it('caches results within ttl', async () => {
    const a = await svc.getCryptoPrice('btc')
    const b = await svc.getCryptoPrice('BTC')
    expect(a.price).toBe(b.price)
    expect(repo.calls).toBe(1)
  })

  it('expires cache after ttl', async () => {
    const a = await svc.getCryptoPrice('eth')
    // fast-forward time by replacing Date.now via vi
    const original = Date.now
    try {
      // move time forward beyond ttl
      const future = () => original() + 2000
      vi.stubGlobal('Date', { now: future } as unknown as Date)
      const b = await svc.getCryptoPrice('eth')
      expect(a.price).not.toBe(b.price)
      expect(repo.calls).toBe(2)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
