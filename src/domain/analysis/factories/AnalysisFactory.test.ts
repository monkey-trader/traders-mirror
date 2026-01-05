import { describe, it, expect } from 'vitest';
import { AnalysisFactory } from './AnalysisFactory';

describe('AnalysisFactory', () => {
  it('creates an Analysis with default timeframes', () => {
    const a = AnalysisFactory.create({ symbol: 'eurusd' });
    const symbol = typeof a.symbol === 'string' ? a.symbol : (a.symbol as { value: string }).value;
    expect(symbol).toBe('EURUSD');
    expect(a.timeframes).toHaveProperty('monthly');
    expect(a.timeframes).toHaveProperty('15min');
  });

  it('accepts timeframe inputs array', () => {
    const a = AnalysisFactory.create({
      symbol: 'btcusd',
      timeframes: [
        {
          timeframe: 'daily',
          tradingViewLink: 'https://www.tradingview.com/chart/abc',
          note: 'daily note',
        },
      ],
    });
    const symbol2 = typeof a.symbol === 'string' ? a.symbol : (a.symbol as { value: string }).value;
    expect(symbol2).toBe('BTCUSD');
    expect(a.timeframes.daily.tradingViewLink).toContain('tradingview.com');
    expect(a.timeframes.daily.note).toBe('daily note');
  });
});
