import { Timeframe } from '@/domain/analysis/interfaces/AnalysisRepository';
import { TradeSymbol } from '@/domain/analysis/valueObjects/TradeSymbol';
import { AnalysisId } from '@/domain/analysis/valueObjects/AnalysisId';

export type TimeframeAnalysis = {
  timeframe: Timeframe;
  tradingViewLink?: string;
  note?: string;
};

export class Analysis {
  constructor(
    public readonly id: AnalysisId,
    public readonly symbol: TradeSymbol,
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
