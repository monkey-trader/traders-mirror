// Expanded mock trades for seeding/testing
import type { RepoTrade } from './InMemoryTradeRepository'

// A few extra crypto mock trades (realistic symbols and variety)
export const MORE_CRYPTO_MOCK_TRADES: RepoTrade[] = [
  { id: 'c1', market: 'Crypto', symbol: 'ETHUSD', entryDate: '2025-12-23T12:10:00Z', size: 0.25, price: 1850.0, side: 'LONG', status: 'OPEN', pnl: 12.3, notes: 'Mean-reversion entry', entry: '1848', sl: 1820, tp1: 1875, tp2: 1900, tp3: 1950, tp4: 2000, margin: 80, leverage: 5 },
  { id: 'c2', market: 'Crypto', symbol: 'BTCUSD', entryDate: '2025-12-23T11:45:00Z', size: 0.08, price: 43000, side: 'SHORT', status: 'OPEN', pnl: -40, notes: 'Fading breakout', entry: '43050', sl: 43500, tp1: 42500, tp2: 42000, tp3: 40500, tp4: 40000, margin: 700, leverage: 10 },
  { id: 'c3', market: 'Crypto', symbol: 'SOLUSD', entryDate: '2025-12-23T10:20:00Z', size: 15, price: 98.2, side: 'LONG', status: 'OPEN', pnl: 6.1, notes: 'Breakout retest', entry: '97.5', sl: 95, tp1: 104, tp2: 110, tp3: 120, tp4: 130, margin: 150, leverage: 4 },
  { id: 'c4', market: 'Crypto', symbol: 'ADAUSD', entryDate: '2025-12-23T09:35:00Z', size: 300, price: 1.34, side: 'SHORT', status: 'CLOSED', pnl: -3.5, notes: 'News spike', entry: '1.36', sl: 1.40, tp1: 1.30, tp2: 1.25, tp3: 1.20, tp4: 1.15, margin: 60, leverage: 8 },
  { id: 'c5', market: 'Crypto', symbol: 'XRPUSD', entryDate: '2025-12-23T08:50:00Z', size: 600, price: 0.98, side: 'LONG', status: 'OPEN', pnl: 10, notes: 'Range trade', entry: '0.97', sl: 0.93, tp1: 1.02, tp2: 1.08, tp3: 1.15, tp4: 1.22, margin: 40, leverage: 6 },
  { id: 'c6', market: 'Crypto', symbol: 'MATICUSD', entryDate: '2025-12-23T07:30:00Z', size: 400, price: 2.20, side: 'LONG', status: 'OPEN', pnl: 2.2, notes: 'Accumulation area', entry: '2.18', sl: 2.05, tp1: 2.35, tp2: 2.60, tp3: 3.00, tp4: 3.50, margin: 70, leverage: 5 },
  { id: 'c7', market: 'Crypto', symbol: 'DOTUSD', entryDate: '2025-12-23T06:15:00Z', size: 120, price: 7.8, side: 'SHORT', status: 'OPEN', pnl: -1.1, notes: 'Momentum fade', entry: '7.95', sl: 8.5, tp1: 7.2, tp2: 6.8, tp3: 6.0, tp4: 5.5, margin: 60, leverage: 6 },
  { id: 'c8', market: 'Crypto', symbol: 'LINKUSD', entryDate: '2025-12-23T05:50:00Z', size: 90, price: 18.2, side: 'LONG', status: 'OPEN', pnl: 4.0, notes: 'Bull flag', entry: '18.0', sl: 17.2, tp1: 19.5, tp2: 21.0, tp3: 24.0, tp4: 27.0, margin: 120, leverage: 3 },
  { id: 'c9', market: 'Crypto', symbol: 'AVAXUSD', entryDate: '2025-12-23T05:10:00Z', size: 40, price: 38.4, side: 'LONG', status: 'OPEN', pnl: 8.5, notes: 'Dip buy', entry: '37.8', sl: 36.0, tp1: 40.0, tp2: 42.5, tp3: 48.0, tp4: 55.0, margin: 90, leverage: 4 },
  { id: 'c10', market: 'Crypto', symbol: 'SOLUSD', entryDate: '2025-12-24T02:00:00Z', size: 5, price: 100.0, side: 'LONG', status: 'CLOSED', pnl: 25, notes: 'Scalp', entry: '99.5', sl: 98, tp1: 101, tp2: 105, tp3: 110, tp4: 115, margin: 60, leverage: 2 }
]

// A few extra forex mock trades
export const MORE_FOREX_MOCK_TRADES: RepoTrade[] = [
  { id: 'f1', market: 'Forex', symbol: 'EURUSD', entryDate: '2025-12-23T14:00:00Z', size: 12000, price: 1.1180, side: 'SHORT', status: 'OPEN', pnl: -6.4, notes: 'Breakdown', entry: '1.1185', sl: 1.1210, tp1: 1.1120, tp2: 1.1080, tp3: 1.1020, tp4: 1.0980, margin: 110, leverage: 20 },
  { id: 'f2', market: 'Forex', symbol: 'GBPUSD', entryDate: '2025-12-23T13:30:00Z', size: 9000, price: 1.3255, side: 'LONG', status: 'OPEN', pnl: 8.0, notes: 'Momentum play', entry: '1.3240', sl: 1.3200, tp1: 1.3350, tp2: 1.3450, tp3: 1.3600, tp4: 1.3750, margin: 130, leverage: 15 },
  { id: 'f3', market: 'Forex', symbol: 'USDJPY', entryDate: '2025-12-23T12:45:00Z', size: 6000, price: 135.10, side: 'SHORT', status: 'OPEN', pnl: -2.0, notes: 'Reversal', entry: '135.50', sl: 136.00, tp1: 134.20, tp2: 133.50, tp3: 132.00, tp4: 130.50, margin: 140, leverage: 25 },
  { id: 'f4', market: 'Forex', symbol: 'AUDUSD', entryDate: '2025-12-23T11:20:00Z', size: 7500, price: 0.7520, side: 'LONG', status: 'CLOSED', pnl: 15.1, notes: 'Fed comments', entry: '0.7480', sl: 0.7450, tp1: 0.7600, tp2: 0.7700, tp3: 0.7800, tp4: 0.7900, margin: 95, leverage: 10 },
  { id: 'f5', market: 'Forex', symbol: 'USDCAD', entryDate: '2025-12-23T10:40:00Z', size: 5000, price: 1.2750, side: 'LONG', status: 'OPEN', pnl: 1.2, notes: 'Carry trade', entry: '1.2740', sl: 1.2700, tp1: 1.2790, tp2: 1.2850, tp3: 1.2950, tp4: 1.3050, margin: 80, leverage: 12 },
  { id: 'f6', market: 'Forex', symbol: 'NZDUSD', entryDate: '2025-12-23T09:50:00Z', size: 4000, price: 0.6785, side: 'SHORT', status: 'OPEN', pnl: -0.8, notes: 'Trend continuation', entry: '0.6792', sl: 0.6820, tp1: 0.6750, tp2: 0.6700, tp3: 0.6650, tp4: 0.6600, margin: 60, leverage: 15 },
  { id: 'f7', market: 'Forex', symbol: 'EURJPY', entryDate: '2025-12-23T08:30:00Z', size: 3000, price: 151.40, side: 'LONG', status: 'OPEN', pnl: 5.0, notes: 'Correlation play', entry: '151.10', sl: 150.50, tp1: 152.00, tp2: 153.00, tp3: 155.00, tp4: 157.00, margin: 120, leverage: 10 },
  { id: 'f8', market: 'Forex', symbol: 'GBPJPY', entryDate: '2025-12-23T07:20:00Z', size: 2500, price: 179.55, side: 'SHORT', status: 'OPEN', pnl: -7.3, notes: 'Volatility spike', entry: '179.90', sl: 181.00, tp1: 178.00, tp2: 176.50, tp3: 174.00, tp4: 172.00, margin: 200, leverage: 8 }
]

export const COMBINED_MOCK_TRADES: RepoTrade[] = [
  ...MORE_CRYPTO_MOCK_TRADES,
  ...MORE_FOREX_MOCK_TRADES
]
