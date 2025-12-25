// Simple in-memory repository used for demo/testing. Not persistent.
export type RepoTrade = {
  id: string
  market: 'Crypto' | 'Forex' | 'All'
  symbol: string
  entryDate: string
  size: number
  price: number
  side: 'LONG' | 'SHORT'
  status: 'OPEN' | 'CLOSED' | 'FILLED'
  pnl: number
  notes?: string
  entry?: string
  sl?: string
  tp1?: string
  tp2?: string
  tp3?: string
  margin?: string
  leverage?: string
}

const DEFAULT_MOCK_TRADES: RepoTrade[] = [
  {
    id: 't1', market: 'Crypto', symbol: 'ETHUSD', entryDate: '2025-12-21T10:12:00Z', size: 0.51, price: 1800.5,
    side: 'SHORT', status: 'OPEN', pnl: 0, notes: 'Scalp-Short nach Fehlausbruch.', entry: '1802.0', sl: '1815.0',
    tp1: '1790.0', tp2: '1775.0', tp3: '1750.0', margin: '120', leverage: '10x'
  },
  {
    id: 't2', market: 'Crypto', symbol: 'ETHUSD', entryDate: '2025-12-21T09:50:00Z', size: 0.37, price: 1795.3,
    side: 'LONG', status: 'OPEN', pnl: 0, notes: 'Rebound nach Support.', entry: '1794.0', sl: '1790.0',
    tp1: '1805.0', tp2: '1820.0', tp3: '1850.0', margin: '90', leverage: '8x'
  },
  {
    id: 't3', market: 'Forex', symbol: 'EURUSD', entryDate: '2025-12-20T08:30:00Z', size: 10000, price: 1.1203,
    side: 'LONG', status: 'CLOSED', pnl: -12.5, notes: 'Reverted on news', entry: '1.1190', sl: '1.1170',
    tp1: '1.1250', tp2: '1.1280', tp3: '1.1300', margin: '100', leverage: '10x'
  },
  {
    id: 't4', market: 'Crypto', symbol: 'BTCUSD', entryDate: '2025-12-22T11:00:00Z', size: 0.12, price: 42000.0,
    side: 'LONG', status: 'OPEN', pnl: 150.5, notes: 'Breakout trade, trailing SL.', entry: '41950', sl: '41700',
    tp1: '42500', tp2: '43000', tp3: '44000', margin: '500', leverage: '5x'
  },
  {
    id: 't5', market: 'Crypto', symbol: 'SOLUSD', entryDate: '2025-12-22T10:30:00Z', size: 10, price: 95.2,
    side: 'SHORT', status: 'OPEN', pnl: -20.1, notes: 'Short nach Fehlausbruch.', entry: '96.0', sl: '98.0',
    tp1: '92.0', tp2: '89.0', tp3: '85.0', margin: '200', leverage: '3x'
  },
  {
    id: 't6', market: 'Forex', symbol: 'USDJPY', entryDate: '2025-12-22T09:45:00Z', size: 5000, price: 134.55,
    side: 'LONG', status: 'OPEN', pnl: 10.0, notes: 'Range-Breakout, TP1 erreicht.', entry: '134.20', sl: '133.80',
    tp1: '134.80', tp2: '135.20', tp3: '136.00', margin: '150', leverage: '20x'
  },
  {
    id: 't7', market: 'Crypto', symbol: 'ADAUSD', entryDate: '2025-12-22T08:10:00Z', size: 200, price: 1.25,
    side: 'LONG', status: 'OPEN', pnl: 5.5, notes: 'Scalp, schnelle Bewegung erwartet.', entry: '1.24', sl: '1.22',
    tp1: '1.28', tp2: '1.32', tp3: '1.36', margin: '50', leverage: '10x'
  },
  {
    id: 't8', market: 'Forex', symbol: 'GBPUSD', entryDate: '2025-12-22T07:30:00Z', size: 8000, price: 1.3200,
    side: 'SHORT', status: 'OPEN', pnl: -8.2, notes: 'News-Event, SL eng.', entry: '1.3210', sl: '1.3230',
    tp1: '1.3180', tp2: '1.3150', tp3: '1.3100', margin: '120', leverage: '15x'
  },
  {
    id: 't9', market: 'Crypto', symbol: 'XRPUSD', entryDate: '2025-12-22T06:50:00Z', size: 500, price: 0.95,
    side: 'LONG', status: 'OPEN', pnl: 2.1, notes: 'TP1 fast erreicht.', entry: '0.94', sl: '0.92',
    tp1: '0.97', tp2: '1.00', tp3: '1.05', margin: '30', leverage: '8x'
  },
  {
    id: 't10', market: 'Crypto', symbol: 'DOGEUSD', entryDate: '2025-12-22T06:20:00Z', size: 1000, price: 0.12,
    side: 'SHORT', status: 'OPEN', pnl: -1.5, notes: 'Memecoin-Short, hohes Risiko.', entry: '0.13', sl: '0.14',
    tp1: '0.11', tp2: '0.10', tp3: '0.09', margin: '25', leverage: '2x'
  },
  {
    id: 't11', market: 'Forex', symbol: 'AUDUSD', entryDate: '2025-12-22T05:40:00Z', size: 6000, price: 0.7550,
    side: 'LONG', status: 'OPEN', pnl: 3.3, notes: 'TP2 Ziel, SL nachgezogen.', entry: '0.7540', sl: '0.7520',
    tp1: '0.7570', tp2: '0.7600', tp3: '0.7650', margin: '80', leverage: '12x'
  },
  {
    id: 't12', market: 'Crypto', symbol: 'MATICUSD', entryDate: '2025-12-22T05:10:00Z', size: 300, price: 2.10,
    side: 'LONG', status: 'OPEN', pnl: 7.7, notes: 'Layer2 Hype, TP1 erreicht.', entry: '2.05', sl: '2.00',
    tp1: '2.15', tp2: '2.25', tp3: '2.40', margin: '60', leverage: '7x'
  },
  {
    id: 't13', market: 'Forex', symbol: 'USDCAD', entryDate: '2025-12-22T04:30:00Z', size: 4000, price: 1.2700,
    side: 'SHORT', status: 'OPEN', pnl: -4.0, notes: 'Korrektur-Short, TP1 offen.', entry: '1.2710', sl: '1.2730',
    tp1: '1.2680', tp2: '1.2650', tp3: '1.2600', margin: '70', leverage: '9x'
  }
]

export class InMemoryTradeRepository {
  private trades: RepoTrade[]

  constructor(initial: RepoTrade[] = DEFAULT_MOCK_TRADES) {
    this.trades = initial.map(t => ({ ...t }))
  }

  async save(trade: RepoTrade): Promise<void> {
    this.trades.push({ ...trade })
  }

  async getAll(): Promise<RepoTrade[]> {
    return this.trades.map(t => ({ ...t }))
  }

  async update(trade: RepoTrade): Promise<void> {
    const idx = this.trades.findIndex(t => t.id === trade.id)
    if (idx >= 0) this.trades[idx] = { ...this.trades[idx], ...trade }
  }
}

export default InMemoryTradeRepository
