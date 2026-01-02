export type TimeframeKey = 'monthly' | 'weekly' | 'daily' | '4h' | '2h' | '1h' | '15min';
export type TimeframeInput = { timeframe: TimeframeKey; tradingViewLink?: string; note?: string };

export const DEFAULT_TIMEFRAMES: TimeframeKey[] = [
  'monthly',
  'weekly',
  'daily',
  '4h',
  '2h',
  '1h',
  '15min',
];
