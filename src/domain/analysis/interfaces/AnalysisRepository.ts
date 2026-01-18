export type Timeframe = 'monthly' | 'weekly' | 'daily' | '4h' | '2h' | '1h' | '15min';

export type TimeframeAnalysisDTO = {
  timeframe: Timeframe;
  tradingViewLink?: string;
  note?: string;
};

import type { AnalysisSetup } from '@/presentation/analysis/setups';
export type AnalysisDTO = {
  id: string;
  symbol: string;
  createdAt: string;
  updatedAt?: string;
  market?: 'Forex' | 'Crypto';
  timeframes: Record<Timeframe, TimeframeAnalysisDTO>;
  notes?: string;
  setups?: AnalysisSetup[];
};

export type AnalysisRepository = {
  save(analysis: AnalysisDTO): Promise<void>;
  getById(id: string): Promise<AnalysisDTO | null>;
  listBySymbol(symbol: string): Promise<AnalysisDTO[]>;
  listAll(): Promise<AnalysisDTO[]>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
};
