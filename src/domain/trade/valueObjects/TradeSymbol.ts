export class TradeSymbol {
  public readonly value: string
  constructor(symbol: string) {
    if (!symbol || typeof symbol !== 'string') throw new TradeSymbolInvalidError(symbol)
    this.value = symbol.trim().toUpperCase()
  }
}

export class TradeSymbolInvalidError extends Error {
  constructor(symbol: unknown) {
    super(`Trade symbol invalid: ${symbol}`)
    this.name = 'TradeSymbolInvalidError'
  }
}

