import { describe, it, expect } from 'vitest';
import { TradingViewLink } from './TradingViewLink';
import { TradingViewLinkInvalidError } from '@/domain/analysis/errors/TradingViewLinkInvalidError';

describe('TradingViewLink VO', () => {
  it('accepts empty/undefined as empty value', () => {
    const l1 = new TradingViewLink();
    expect(l1.value).toBe('');
    const l2 = new TradingViewLink('');
    expect(l2.value).toBe('');
  });

  it('accepts valid URL', () => {
    const u = new TradingViewLink('https://www.tradingview.com/chart/abcd/');
    expect(u.value).toBe('https://www.tradingview.com/chart/abcd/');
  });

  it('throws for invalid URL', () => {
    expect(() => new TradingViewLink('not-a-url')).toThrow(TradingViewLinkInvalidError);
  });
});
