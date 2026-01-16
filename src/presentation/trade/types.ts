// Shared types for presentation/trade
export type TradeRow = {
  id: string;
  market: 'Crypto' | 'Forex' | 'All';
  analysisId?: string;
  symbol: string;
  entryDate: string;
  size: number;
  price: number;
  side: 'LONG' | 'SHORT';
  status: 'OPEN' | 'CLOSED' | 'FILLED';
  pnl: number;
  notes?: string;
  entry?: string;
  sl?: number;
  slIsBE?: boolean;
  tp1?: number;
  tp2?: number;
  tp3?: number;
  tp4?: number;
  margin?: number;
  leverage?: number;
};
