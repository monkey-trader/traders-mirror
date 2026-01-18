import { Timeframe } from '@/domain/analysis/interfaces/AnalysisRepository';
import type { AnalysisSetup } from '@/presentation/analysis/setups';
import { TradeSymbol } from '@/domain/analysis/valueObjects/TradeSymbol';
import { AnalysisId } from '@/domain/analysis/valueObjects/AnalysisId';
import { Notes } from '@/domain/trade/valueObjects/Notes';

export type TimeframeAnalysis = {
  timeframe: Timeframe;
  tradingViewLink?: string;
  note?: string;
};

export class Analysis {
  readonly id: AnalysisId;
  readonly symbol: TradeSymbol;
  readonly market: 'Forex' | 'Crypto' | undefined;
  readonly createdAt: string;
  readonly timeframes: Record<Timeframe, TimeframeAnalysis>;
  readonly notes?: Notes;
  readonly updatedAt?: string;
  readonly setups?: AnalysisSetup[];

  constructor(
    id: AnalysisId,
    symbol: TradeSymbol,
    market: 'Forex' | 'Crypto' | undefined,
    createdAt: string,
    timeframes: Record<Timeframe, TimeframeAnalysis>,
    notes?: Notes,
    updatedAt?: string,
    setups?: AnalysisSetup[]
  ) {
    if (!id) throw new Error('Analysis id is required');
    if (!symbol) throw new Error('Symbol is required');
    if (!createdAt) throw new Error('CreatedAt is required');
    this.id = id;
    this.symbol = symbol;
    this.market = market;
    this.createdAt = createdAt;
    this.timeframes = timeframes;
    this.notes = notes;
    this.updatedAt = updatedAt;

    this.setups = setups;
  }
}
