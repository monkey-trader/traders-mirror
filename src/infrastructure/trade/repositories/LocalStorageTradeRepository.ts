// LocalStorage-backed repository with logging
// Mirrors the shape/behaviour of InMemoryTradeRepository but persists to window.localStorage

import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository';
import { TradeFactory } from '@/domain/trade/entities/TradeFactory';
import { Trade } from '@/domain/trade/entities/Trade';

export type RepoTrade = {
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

const STORAGE_KEY = 'mt_trades_v1';

const DEFAULT_MOCK_TRADES: RepoTrade[] = [
  // keep a small default set similar to InMemory for first-run UX
  {
    id: 't1',
    market: 'Crypto',
    symbol: 'ETHUSD',
    entryDate: '2025-12-21T10:12:00Z',
    size: 0.51,
    price: 1800.5,
    side: 'SHORT',
    status: 'OPEN',
    pnl: 0,
    notes: 'Scalp-Short nach Fehlausbruch.',
    entry: '1802.0',
    sl: 1815.0,
    tp1: 1790.0,
    tp2: 1775.0,
    tp3: 1750.0,
    tp4: 1730.0,
    margin: 120,
    leverage: 10,
  },
];

// Implement the domain TradeRepository interface: accept/return domain Trade entities
export class LocalStorageTradeRepository implements TradeRepository {
  private trades: RepoTrade[] = [];
  private key: string;

  // options: { seedDefaults?: boolean } - when false, do not seed DEFAULT_MOCK_TRADES on first run
  constructor(key = STORAGE_KEY, options?: { seedDefaults?: boolean }) {
    this.key = key;
    const seedDefaults = options?.seedDefaults !== undefined ? options?.seedDefaults : true;
    try {
      const raw = window.localStorage.getItem(this.key);
      if (raw) {
        const parsed = JSON.parse(raw) as RepoTrade[];
        this.trades = parsed.map((t) => ({ ...t }));
        // eslint-disable-next-line no-console
        console.info('[LocalStorageRepo] loaded', this.trades.length, 'trades');
      } else if (seedDefaults) {
        this.trades = DEFAULT_MOCK_TRADES.map((t) => ({ ...t }));
        this.flush();
        // eslint-disable-next-line no-console
        console.info('[LocalStorageRepo] initialized with defaults');
      } else {
        this.trades = [];
        // eslint-disable-next-line no-console
        console.info('[LocalStorageRepo] initialized empty (no defaults)');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[LocalStorageRepo] failed to initialize', err);
      this.trades = seedDefaults ? DEFAULT_MOCK_TRADES.map((t) => ({ ...t })) : [];
    }
  }

  // Public helper to seed repository with additional trades and persist immediately.
  // Accepts an array of RepoTrade and appends them to storage.
  seed(trades: RepoTrade[]) {
    if (!Array.isArray(trades) || trades.length === 0) return;
    // avoid mutating input
    const toAdd = trades.map((t) => ({ ...t }));
    this.trades = [...toAdd, ...this.trades];
    this.flush();
    // eslint-disable-next-line no-console
    console.info('[LocalStorageRepo] seeded', toAdd.length, 'trades');
  }

  private flush() {
    try {
      window.localStorage.setItem(this.key, JSON.stringify(this.trades));
      // eslint-disable-next-line no-console
      console.info('[LocalStorageRepo] flushed', this.trades.length, 'trades to localStorage');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[LocalStorageRepo] failed to persist to localStorage', err);
    }
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private looksLikeVOTrade(obj: unknown): obj is Record<string, unknown> {
    if (!this.isObject(obj)) return false;
    const maybe = obj as Record<string, unknown>;
    return (
      'symbol' in maybe &&
      this.isObject(maybe.symbol) &&
      'value' in (maybe.symbol as Record<string, unknown>)
    );
  }

  private toRepoTrade(obj: unknown): RepoTrade {
    if (this.looksLikeVOTrade(obj)) {
      const o = obj as Record<string, unknown>;
      const symbolVO = o.symbol as Record<string, unknown>;
      const entryDateVO = o.entryDate as Record<string, unknown> | string | undefined;

      return {
        id: String(o.id),
        market: (o.market as RepoTrade['market']) ?? 'All',
        symbol: String(symbolVO.value),
        entryDate:
          entryDateVO && typeof entryDateVO === 'object' && 'value' in entryDateVO
            ? String((entryDateVO as Record<string, unknown>).value)
            : String(entryDateVO ?? new Date().toISOString()),
        size:
          this.isObject(o.size) && 'value' in (o.size as Record<string, unknown>)
            ? Number((o.size as Record<string, unknown>).value)
            : Number(o.size as number),
        price:
          this.isObject(o.price) && 'value' in (o.price as Record<string, unknown>)
            ? Number((o.price as Record<string, unknown>).value)
            : Number(o.price as number),
        side:
          this.isObject(o.side) && 'value' in (o.side as Record<string, unknown>)
            ? (String((o.side as Record<string, unknown>).value) as 'LONG' | 'SHORT')
            : (o.side as 'LONG' | 'SHORT'),
        status: (o.status as RepoTrade['status']) ?? 'OPEN',
        pnl: Number(o.pnl ?? 0),
        notes: o.notes as string | undefined,
        entry: o.entry as string | undefined,
        sl: typeof o.sl === 'number' ? (o.sl as number) : undefined,
        tp1: typeof o.tp1 === 'number' ? (o.tp1 as number) : undefined,
        tp2: typeof o.tp2 === 'number' ? (o.tp2 as number) : undefined,
        tp3: typeof o.tp3 === 'number' ? (o.tp3 as number) : undefined,
        tp4: typeof o.tp4 === 'number' ? (o.tp4 as number) : undefined,
        margin: typeof o.margin === 'number' ? (o.margin as number) : undefined,
        leverage: typeof o.leverage === 'number' ? (o.leverage as number) : undefined,
      };
    }

    if (this.isObject(obj)) {
      const o = obj as Record<string, unknown>;
      return {
        id: String(o.id),
        market: (o.market as RepoTrade['market']) ?? 'All',
        symbol: String(o.symbol),
        entryDate: String(o.entryDate),
        size: Number(o.size as number),
        price: Number(o.price as number),
        side: (o.side as RepoTrade['side']) ?? 'LONG',
        status: (o.status as RepoTrade['status']) ?? 'OPEN',
        pnl: Number(o.pnl ?? 0),
        notes: o.notes as string | undefined,
        entry: o.entry as string | undefined,
        sl: typeof o.sl === 'number' ? (o.sl as number) : undefined,
        tp1: typeof o.tp1 === 'number' ? (o.tp1 as number) : undefined,
        tp2: typeof o.tp2 === 'number' ? (o.tp2 as number) : undefined,
        tp3: typeof o.tp3 === 'number' ? (o.tp3 as number) : undefined,
        tp4: typeof o.tp4 === 'number' ? (o.tp4 as number) : undefined,
        margin: typeof o.margin === 'number' ? (o.margin as number) : undefined,
        leverage: typeof o.leverage === 'number' ? (o.leverage as number) : undefined,
      };
    }

    const now = new Date().toISOString();
    return {
      id: 'unknown',
      market: 'All',
      symbol: 'UNKNOWN',
      entryDate: now,
      size: 0,
      price: 0,
      side: 'LONG',
      status: 'OPEN',
      pnl: 0,
    };
  }

  // Accept domain Trade entity, persist primitive DTO, and flush
  async save(trade: Trade): Promise<void> {
    const dto = TradeFactory.toDTO(trade);
    const repoTrade = this.toRepoTrade(dto);
    this.trades.push({ ...repoTrade });
    // eslint-disable-next-line no-console
    console.info('[LocalStorageRepo] save', repoTrade.id);
    this.flush();
  }

  // Return domain Trade[] (reconstructed from stored primitives)
  async getAll(): Promise<Trade[]> {
    // convert each RepoTrade -> Trade via TradeFactory
    return this.trades.map((rt) => {
      const input = {
        id: rt.id,
        symbol: rt.symbol,
        entryDate: rt.entryDate,
        size: rt.size,
        price: rt.price,
        side: rt.side,
        notes: rt.notes,
        market: rt.market,
        sl: rt.sl,
        tp1: rt.tp1,
        tp2: rt.tp2,
        tp3: rt.tp3,
        tp4: rt.tp4,
        leverage: rt.leverage,
        margin: rt.margin,
      };
      try {
        return TradeFactory.create(input);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[LocalStorageRepo] failed to convert stored trade to domain Trade', err);
        // create a minimal Trade to keep API stable
        return TradeFactory.create({
          id: rt.id,
          symbol: rt.symbol,
          entryDate: rt.entryDate,
          size: rt.size,
          price: rt.price,
          side: rt.side,
        });
      }
    });
  }

  async update(trade: Trade): Promise<void> {
    const dto = TradeFactory.toDTO(trade);
    const repoTrade = this.toRepoTrade(dto);
    const idx = this.trades.findIndex((t) => t.id === repoTrade.id);
    if (idx >= 0) {
      this.trades[idx] = { ...this.trades[idx], ...repoTrade };
      // eslint-disable-next-line no-console
      console.info('[LocalStorageRepo] update', repoTrade.id);
      this.flush();
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        '[LocalStorageRepo] update: trade not found, performing save instead',
        repoTrade.id
      );
      await this.save(trade);
    }
  }

  // Delete a trade by id
  async delete(id: string): Promise<void> {
    const idx = this.trades.findIndex((t) => t.id === id);
    if (idx >= 0) {
      this.trades.splice(idx, 1);
      // eslint-disable-next-line no-console
      console.info('[LocalStorageRepo] delete', id);
      this.flush();
    }
  }
}

export default LocalStorageTradeRepository;
