import { Timeframe } from '@/domain/analysis/interfaces/AnalysisRepository';

export type TimeframeAnalysis = {
  timeframe: Timeframe;
  tradingViewLink?: string;
  note?: string;
};

export class Analysis {
  constructor(
    public readonly id: string,
    public readonly symbol: string,
    public readonly market: 'Forex' | 'Crypto' | undefined,
    public readonly createdAt: string,
    public readonly timeframes: Record<Timeframe, TimeframeAnalysis>,
    public readonly notes?: string,
    public readonly updatedAt?: string
  ) {
    if (!id) throw new Error('Analysis id is required');
    if (!symbol) throw new Error('Symbol is required');
    if (!createdAt) throw new Error('CreatedAt is required');
  }
}
