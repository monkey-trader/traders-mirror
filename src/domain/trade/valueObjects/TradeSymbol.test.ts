import { describe, it, expect } from 'vitest';
import { TradeSymbol, TradeSymbolInvalidError } from './TradeSymbol';

describe('TradeSymbol VO', () => {
  it('normalizes symbol to uppercase and trims', () => {
    const ts = new TradeSymbol(' ethusd ');
    expect(ts.value).toBe('ETHUSD');
  });

  it('throws TradeSymbolInvalidError for empty string', () => {
    expect(() => new TradeSymbol('')).toThrow(TradeSymbolInvalidError);
  });

  it('throws TradeSymbolInvalidError for non-string', () => {
    // @ts-expect-error intentional invalid input
    expect(() => new TradeSymbol(null)).toThrow(TradeSymbolInvalidError);
  });
});
