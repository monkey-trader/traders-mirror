// Shared types for presentation/trade
export type TradeRow = {
  id: string;
  market: 'Crypto' | 'Forex' | 'All';
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
  tp1?: number;
  tp2?: number;
  tp3?: number;
  tp4?: number;
  margin?: number;
  leverage?: number;
};
