export class TradingViewLinkInvalidError extends Error {
  constructor(message = 'TradingView link is invalid') {
    super(message);
    this.name = 'TradingViewLinkInvalidError';
  }
}
