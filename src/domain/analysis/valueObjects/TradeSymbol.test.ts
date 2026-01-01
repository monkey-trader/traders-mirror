import { describe, it, expect } from 'vitest';
import { TradeSymbol } from './TradeSymbol';
import { TradeSymbolInvalidError } from '@/domain/analysis/errors/TradeSymbolInvalidError';

describe('TradeSymbol VO', () => {
  it('normalizes to uppercase and trims', () => {
    const s = new TradeSymbol('  eurusd  ');
    expect(s.value).toBe('EURUSD');
  });

  it('allows numbers and dash and slash', () => {
    const s = new TradeSymbol('btc-usd/3');
    expect(s.value).toBe('BTC-USD/3');
  });

  it('throws for empty string', () => {
    expect(() => new TradeSymbol('   ')).toThrow(TradeSymbolInvalidError);
  });

  it('throws for invalid chars', () => {
    expect(() => new TradeSymbol('EUR$USD')).toThrow(TradeSymbolInvalidError);
  });
});
