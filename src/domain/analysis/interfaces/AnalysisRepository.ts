export type Timeframe = 'monthly' | 'weekly' | 'daily' | '4h' | '2h' | '1h' | '15min';

export type TimeframeAnalysisDTO = {
  timeframe: Timeframe;
  tradingViewLink?: string;
  note?: string;
};

export type AnalysisDTO = {
  id: string;
  symbol: string;
  createdAt: string;
  updatedAt?: string;
  market?: 'Forex' | 'Crypto';
  timeframes: Record<Timeframe, TimeframeAnalysisDTO>;
  notes?: string;
  userId?: string; // for Firestore security rules
};

export type AnalysisRepository = {
  save(analysis: AnalysisDTO): Promise<void>;
  getById(id: string): Promise<AnalysisDTO | null>;
  listBySymbol(symbol: string): Promise<AnalysisDTO[]>;
  listAll(): Promise<AnalysisDTO[]>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
};
