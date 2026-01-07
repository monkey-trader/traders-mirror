import { describe, it, expect } from 'vitest';
import { Analysis } from './Analysis';
import { AnalysisFactory } from '@/domain/analysis/factories/AnalysisFactory';
import { Notes } from '@/domain/trade/valueObjects/Notes';
import { AnalysisId } from '@/domain/analysis/valueObjects/AnalysisId';
import { TradeSymbol } from '@/domain/analysis/valueObjects/TradeSymbol';

describe('Analysis Entity', () => {
  it('requires id, symbol and createdAt', () => {
    const full = AnalysisFactory.create({ id: 'a', symbol: 'EURUSD' });
    const newSymbol = new TradeSymbol('EURUSD');
    expect(
      () =>
        new Analysis(new AnalysisId(''), newSymbol, full.market, full.createdAt, full.timeframes)
    ).toThrow();
    expect(
      () =>
        new Analysis(
          new AnalysisId('id1'),
          new TradeSymbol(''),
          full.market,
          full.createdAt,
          full.timeframes
        )
    ).toThrow();
    expect(
      () =>
        new Analysis(
          new AnalysisId('id1'),
          newSymbol,
          full.market,
          '' as unknown as string,
          full.timeframes
        )
    ).toThrow();
  });

  it('creates with valid data', () => {
    const full = AnalysisFactory.create({ id: 'a', symbol: 'EURUSD' });
    const a = new Analysis(
      new AnalysisId('id1'),
      full.symbol,
      full.market,
      full.createdAt,
      full.timeframes,
      new Notes('note')
    );
    expect(a.id.value).toBe('ID1');
    expect(a.symbol.value).toBe('EURUSD');
    expect(a.notes?.value).toBe('note');
  });
});
