import { describe, it, expect } from 'vitest';
import { Confluence, ALLOWED_TIMEFRAMES, ALLOWED_CONFLUENCES, ALLOWED_EXTRA_CONFLUENCES } from './Confluence';

describe('Confluence VO', () => {
  it('creates from valid type and timeframe', () => {
    const c = new Confluence('50 EMA', '30min');
    expect(c.type).toBe('50 EMA');
    expect(c.timeframe).toBe('30min');
  });

  it('allows missing timeframe', () => {
    const c = new Confluence('FVG');
    expect(c.type).toBe('FVG');
    expect(c.timeframe).toBeUndefined();
  });

  it('throws for empty type', () => {
    expect(() => new Confluence('')).toThrow();
  });

  it('exports allowed lists', () => {
    expect(ALLOWED_TIMEFRAMES).toContain('30min');
    expect(ALLOWED_CONFLUENCES).toContain('50 EMA');
    expect(ALLOWED_EXTRA_CONFLUENCES).toContain('CME Close');
  });
});
