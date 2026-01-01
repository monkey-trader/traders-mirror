import { describe, it, expect } from 'vitest';
import { AnalysisFactory } from './AnalysisFactory';

describe('AnalysisFactory', () => {
  it('creates an Analysis with default timeframes', () => {
    const a = AnalysisFactory.create({ symbol: 'eurusd' });
    expect(a.symbol).toBe('EURUSD');
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
    expect(a.symbol).toBe('BTCUSD');
    expect(a.timeframes.daily.tradingViewLink).toContain('tradingview.com');
    expect(a.timeframes.daily.note).toBe('daily note');
  });
});
