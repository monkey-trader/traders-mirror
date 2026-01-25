import type { PriceRepository, CryptoPrice } from '@/domain/price/interfaces/PriceRepository'

type CoinListItem = { id: string; symbol: string; name: string }

export class CoinGeckoPriceRepository implements PriceRepository {
  private apiBase = 'https://api.coingecko.com/api/v3'
  private symbolToId = new Map<string, string>()
  private coinList: CoinListItem[] = []
  private coinListFetchedAt = 0

  constructor(private coinListTtlMs = 24 * 60 * 60 * 1000) {}

  private async ensureCoinList() {
    const now = Date.now()
    if (this.coinList.length && now - this.coinListFetchedAt < this.coinListTtlMs) return

    const url = `${this.apiBase}/coins/list`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`CoinGecko coins/list failed: ${res.status}`)
    const list: CoinListItem[] = await res.json()
    this.coinList = list
    this.symbolToId.clear()
    for (const item of list) {
      const sym = item.symbol.toLowerCase()
      if (!this.symbolToId.has(sym)) this.symbolToId.set(sym, item.id)
    }
    this.coinListFetchedAt = now
  }

  private guessId(idOrSymbol: string) {
    const v = idOrSymbol.trim().toLowerCase()
    return this.symbolToId.get(v) ?? v
  }

  async getCryptoPrice(idOrSymbol: string, vsCurrency = 'usd'): Promise<CryptoPrice> {
    // support inputs like "BTCUSD", "BTC/USDT", "ETH-USDT" by extracting
    // base asset and optional quote. We prefer fiat USD as vsCurrency.
    const query = (idOrSymbol || '').trim()
    let vs = (vsCurrency || 'usd').toLowerCase()
    // normalize common pair forms and extract base/quote
    const pairMatch = query.match(/^([A-Za-z0-9._-]+)[/ _-]?([A-Za-z0-9._-]+)$/)
    let baseCandidate = query
    if (pairMatch) {
      baseCandidate = pairMatch[1]
      const quoteCandidate = pairMatch[2].toLowerCase()
      if (quoteCandidate.startsWith('usd') || quoteCandidate === 'usdt') vs = 'usd'
    } else {
      // also handle trailing USD/USDT like BTCUSD
      const trailing = query.match(/^([A-Za-z0-9._-]+)(usd|usdt)$/i)
      if (trailing) {
        baseCandidate = trailing[1]
        vs = 'usd'
      }
    }

    await this.ensureCoinList()
    // If the input looks like a short symbol (e.g. BTC), prefer the /search endpoint's
    // relevance ranking to resolve the intended coin id before falling back to the
    // local coin list mapping which can contain collisions.
    let id = this.guessId(baseCandidate)
    const looksLikeSymbol = /^[A-Za-z]{1,6}$/.test(baseCandidate)
    if (looksLikeSymbol) {
      try {
        const searchUrl = `${this.apiBase}/search?query=${encodeURIComponent(baseCandidate)}`
        const sres = await fetch(searchUrl)
        if (sres.ok) {
          const body = await sres.json()
          if (body && Array.isArray(body.coins) && body.coins.length > 0) {
            id = body.coins[0].id
          }
        }
      } catch {
        // ignore and fall back to coinList mapping
      }
    }

    const fetchPriceForId = async (coinId: string) => {
      // try the simple price endpoint first (most lightweight)
      try {
        const url = `${this.apiBase}/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=${encodeURIComponent(
          vs,
        )}&include_last_updated_at=true`
        const res = await fetch(url)
        if (!res.ok) return null
        const body = await res.json()
        const entry = body[coinId]
        if (entry && typeof entry[vs] !== 'undefined') {
          const price = Number(entry[vs])
          const ts = entry.last_updated_at ? entry.last_updated_at * 1000 : Date.now()
          return { price, ts, currency: vs } as CryptoPrice
        }
      } catch {
        // ignore and try markets fallback below
      }

      // fallback to markets endpoint which reliably exposes current_price in USD
      try {
        const marketsUrl = `${this.apiBase}/coins/markets?vs_currency=usd&ids=${encodeURIComponent(
          coinId,
        )}&order=market_cap_desc&per_page=1&page=1&sparkline=false`
        const mres = await fetch(marketsUrl)
        if (!mres.ok) return null
        const markets = await mres.json()
        if (Array.isArray(markets) && markets.length > 0 && typeof markets[0].current_price !== 'undefined') {
          return { price: Number(markets[0].current_price), ts: Date.now(), currency: 'usd' } as CryptoPrice
        }
      } catch {
        // ignore
      }

      return null
    }

    // first try the guessed id/symbol
    try {
      const firstAttempt = await fetchPriceForId(id)
      if (firstAttempt) return firstAttempt
    } catch {
      // ignore and try fallback
    }

    // fallback: use search endpoint to find the most relevant coin id
    try {
      const searchUrl = `${this.apiBase}/search?query=${encodeURIComponent(query)}`
      const sres = await fetch(searchUrl)
      if (sres.ok) {
        const body = await sres.json()
        if (body && Array.isArray(body.coins) && body.coins.length > 0) {
          const candidateId = body.coins[0].id
          const second = await fetchPriceForId(candidateId)
          if (second) return second
        }
      }
    } catch {
      // ignore
    }

    throw new Error(`no price for ${idOrSymbol} / ${vs}`)
  }

  // Search coins by symbol or name and optionally return small image via markets endpoint
  async searchCoins(query: string, limit = 10): Promise<Array<{ id: string; symbol: string; name: string; image?: string }>> {
    const q = query.trim()
    if (!q) return []

    // Prefer the CoinGecko search endpoint which ranks relevance (main coins like bitcoin first)
    try {
      const searchUrl = `${this.apiBase}/search?query=${encodeURIComponent(q)}`
      const sres = await fetch(searchUrl)
      if (sres.ok) {
        const body = await sres.json()
        if (body && Array.isArray(body.coins) && body.coins.length > 0) {
          // Prefer thumbnail/large images returned by the search payload (best-effort),
          // then attempt markets endpoint to override with higher-quality images.
          const sliceWithPossibleImages = body.coins
            .slice(0, limit)
            .map((c: any) => ({ id: c.id, symbol: c.symbol, name: c.name, image: c.thumb || c.large }))

          const ids = sliceWithPossibleImages.map((s: any) => s.id).join(',')
          const url = `${this.apiBase}/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids)}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`
          try {
            const mres = await fetch(url)
            if (mres.ok) {
              const markets = await mres.json()
              const imagesById = new Map<string, string>()
              for (const m of markets) {
                if (m && m.id && m.image) imagesById.set(m.id, m.image)
              }
              return sliceWithPossibleImages.map((s: any) => ({ id: s.id, symbol: s.symbol, name: s.name, image: imagesById.get(s.id) ?? s.image }))
            }
          } catch (err) {
            // best-effort: log for debugging but do not fail the flow
            // eslint-disable-next-line no-console
            console.debug('CoinGecko markets image fetch failed:', err)
          }
          // return the search-provided images when markets fail or are unavailable
          return sliceWithPossibleImages
        }
      }
    } catch {
      // ignore search errors and fallback to coinList method below
    }

    // Fallback: use local coinList filtering when search is unavailable
    await this.ensureCoinList()
    const lc = q.toLowerCase()
    const matches = this.coinList.filter((c) => c.symbol.toLowerCase().includes(lc) || c.name.toLowerCase().includes(lc))
    const fallback = matches.slice(0, limit)
    if (!fallback.length) return []
    return fallback.map((s) => ({ id: s.id, symbol: s.symbol, name: s.name }))
  }
}

export default CoinGeckoPriceRepository
