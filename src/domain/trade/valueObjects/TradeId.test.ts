import { describe, it, expect } from 'vitest';
import { TradeId, TradeIdInvalidError } from './TradeId';

describe('TradeId', () => {
  it('trims and stores value', () => {
    const tradeId = new TradeId('  abc-123  ');
    expect(tradeId.value).toBe('abc-123');
  });

  it('throws on empty input', () => {
    expect(() => new TradeId('   ')).toThrow(TradeIdInvalidError);
  });

  it('throws when not a string', () => {
    expect(() => new TradeId(123 as unknown as string)).toThrow(TradeIdInvalidError);
  });

  it('generates id when crypto uuid available', () => {
    const generated = TradeId.generate();
    expect(typeof generated).toBe('string');
    expect(generated.length).toBeGreaterThan(0);
  });
});
