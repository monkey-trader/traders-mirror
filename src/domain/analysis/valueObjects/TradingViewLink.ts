import { TradingViewLinkInvalidError } from '@/domain/analysis/errors/TradingViewLinkInvalidError';

export class TradingViewLink {
  public readonly value: string;

  constructor(input?: unknown) {
    if (input === undefined || input === null || input === '') {
      this.value = '';
      return;
    }
    if (typeof input !== 'string') throw new TradingViewLinkInvalidError('Link must be a string');
    const trimmed = input.trim();
    try {
      const url = new URL(trimmed);
      // allow any valid URL; prefer TradingView but do not enforce host here
      this.value = url.toString();
    } catch {
      throw new TradingViewLinkInvalidError('Invalid URL');
    }
  }
}
