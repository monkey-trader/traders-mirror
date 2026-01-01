export class TradeSymbolInvalidError extends Error {
  constructor(message = 'Trade symbol is invalid') {
    super(message);
    this.name = 'TradeSymbolInvalidError';
  }
}
