export class Market {
  public readonly value: 'All' | 'Forex' | 'Crypto'

  constructor(raw: string) {
    const v = String(raw ?? '').trim()
    if (!v) throw new MarketInvalidError(v)
    const normalized = (v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()) as 'All' | 'Forex' | 'Crypto'
    if (normalized !== 'All' && normalized !== 'Forex' && normalized !== 'Crypto') throw new MarketInvalidError(normalized)
    this.value = normalized
  }
}

export class MarketInvalidError extends Error {
  constructor(value: unknown) {
    super(`Market invalid: ${value}`)
    this.name = 'MarketInvalidError'
  }
}
