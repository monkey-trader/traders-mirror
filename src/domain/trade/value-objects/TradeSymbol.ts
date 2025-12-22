export class TradeSymbol {
  public readonly value: string

  constructor(value: string) {
    if (!value || value.trim().length === 0) throw new Error('Symbol required')
    const normalized = value.trim().toUpperCase()
    if (normalized.length > 10) throw new Error('Symbol too long')
    // Optional: further regex validation
    this.value = normalized
  }

  toString() {
    return this.value
  }

  equals(other: TradeSymbol) {
    return this.value === other.value
  }
}

