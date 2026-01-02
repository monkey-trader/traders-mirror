import { describe, it, expect } from 'vitest';
import { Analysis } from './Analysis';
import { AnalysisFactory } from '@/domain/analysis/factories/AnalysisFactory';

describe('Analysis Entity', () => {
  it('requires id, symbol and createdAt', () => {
    const full = AnalysisFactory.create({ id: 'a', symbol: 'EURUSD' });
    expect(
      () => new Analysis('', full.symbol, full.market, full.createdAt, full.timeframes)
    ).toThrow();
    expect(() => new Analysis('id1', '', full.market, full.createdAt, full.timeframes)).toThrow();
    expect(
      () => new Analysis('id1', 'EURUSD', full.market, '' as unknown as string, full.timeframes)
    ).toThrow();
  });

  it('creates with valid data', () => {
    const full = AnalysisFactory.create({ id: 'a', symbol: 'EURUSD' });
    const a = new Analysis('id1', 'EURUSD', full.market, full.createdAt, full.timeframes, 'note');
    expect(a.id).toBe('id1');
    expect(a.symbol).toBe('EURUSD');
    expect(a.notes).toBe('note');
  });
});
