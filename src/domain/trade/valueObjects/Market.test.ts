import { describe, it, expect } from 'vitest';
import { Market, MarketInvalidError } from './Market';

describe('Market VO', () => {
  it('normalizes forex and crypto', () => {
    expect(new Market('forex').value).toBe('Forex');
    expect(new Market('CRYPTO').value).toBe('Crypto');
  });

  it('normalizes all', () => {
    expect(new Market('all').value).toBe('All');
  });

  it('throws on invalid market', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- autofix: preserve tests that intentionally use any
    expect(() => new Market('stocks' as any)).toThrow();
  });

  it('throws MarketInvalidError on empty input', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- autofix: preserve tests that intentionally use any
    expect(() => new Market('' as any)).toThrow(MarketInvalidError);
    // @ts-expect-error intentional invalid
    expect(() => new Market(undefined)).toThrow(MarketInvalidError);
  });
});
