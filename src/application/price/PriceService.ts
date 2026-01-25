import type { PriceRepository, CryptoPrice } from '@/domain/price/interfaces/PriceRepository'

type CacheEntry = { value: CryptoPrice; expiresAt: number }

export class PriceService {
  private cache = new Map<string, CacheEntry>()

  constructor(private repo: PriceRepository, private ttlMs = 30_000) {}

  private cacheKey(idOrSymbol: string, vs: string) {
    return `${idOrSymbol.toLowerCase()}|${vs.toLowerCase()}`
  }

  async getCryptoPrice(idOrSymbol: string, vsCurrency = 'usd'): Promise<CryptoPrice> {
    const key = this.cacheKey(idOrSymbol, vsCurrency)
    const now = Date.now()
    const existing = this.cache.get(key)
    if (existing && existing.expiresAt > now) return existing.value

    const fetched = await this.repo.getCryptoPrice(idOrSymbol, vsCurrency)
    this.cache.set(key, { value: fetched, expiresAt: now + this.ttlMs })
    return fetched
  }

  // For testing / admin: clear cache
  clearCache() {
    this.cache.clear()
  }
}

export default PriceService
