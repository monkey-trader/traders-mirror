export class Market {
  public readonly value: 'All' | 'Forex' | 'Crypto'

  constructor(raw: string) {
    const v = String(raw ?? '').trim()
    if (!v) throw new Error('Market required')
    const normalized = (v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()) as 'All' | 'Forex' | 'Crypto'
    if (normalized !== 'All' && normalized !== 'Forex' && normalized !== 'Crypto') throw new Error('Invalid market')
    this.value = normalized
  }
}

