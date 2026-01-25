import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';
import { Trade } from '@/domain/trade/entities/Trade';
import { ensureFirebase, getCurrentUserId } from '@/infrastructure/firebase/client';
import { collection, doc, setDoc, getDocs, query, deleteDoc } from 'firebase/firestore';

export type RepoTrade = {
  id: string;
  market: 'Crypto' | 'Forex' | 'All';
  symbol: string;
  entryDate: string;
  size: number;
  price: number;
  side: 'LONG' | 'SHORT';
  status: 'OPEN' | 'CLOSED' | 'FILLED';
  pnl?: number;
  notes?: string;
  entry?: string;
  confluence?: { timeframe?: string; type: string }[];
  sl?: number;
  slIsBE?: boolean;
  tp1?: number;
  tp2?: number;
  tp3?: number;
  tp4?: number;
  tp1IsHit?: boolean;
  tp2IsHit?: boolean;
  tp3IsHit?: boolean;
  tp4IsHit?: boolean;
  margin?: number;
  leverage?: number;
  analysisId?: string;
  userId: string;
  isShortTerm?: boolean;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function looksLikeVOTrade(obj: unknown): obj is Record<string, unknown> {
  if (!isObject(obj)) return false;
  const maybe = obj as Record<string, unknown>;
  return (
    'symbol' in maybe &&
    isObject(maybe.symbol) &&
    'value' in (maybe.symbol as Record<string, unknown>)
  );
}

function toRepoTrade(obj: unknown, userId: string): RepoTrade {
  if (looksLikeVOTrade(obj)) {
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
      confluence: (o.confluence as { timeframe?: string; type: string }[] | undefined) ?? undefined,
      size:
        isObject(o.size) && 'value' in (o.size as Record<string, unknown>)
          ? Number((o.size as Record<string, unknown>).value)
          : Number(o.size as number),
      price:
        isObject(o.price) && 'value' in (o.price as Record<string, unknown>)
          ? Number((o.price as Record<string, unknown>).value)
          : Number(o.price as number),
      side:
        isObject(o.side) && 'value' in (o.side as Record<string, unknown>)
          ? (String((o.side as Record<string, unknown>).value) as 'LONG' | 'SHORT')
          : (o.side as 'LONG' | 'SHORT'),
      status: (o.status as RepoTrade['status']) ?? 'OPEN',
      pnl: typeof o.pnl === 'number' ? (o.pnl as number) : 0,
      notes: o.notes as string | undefined,
      entry: o.entry as string | undefined,
      sl: typeof o.sl === 'number' ? (o.sl as number) : undefined,
      isShortTerm: typeof o.isShortTerm === 'boolean' ? (o.isShortTerm as boolean) : undefined,
      slIsBE: typeof o.slIsBE === 'boolean' ? (o.slIsBE as boolean) : undefined,
      tp1: typeof o.tp1 === 'number' ? (o.tp1 as number) : undefined,
      tp2: typeof o.tp2 === 'number' ? (o.tp2 as number) : undefined,
      tp3: typeof o.tp3 === 'number' ? (o.tp3 as number) : undefined,
      tp4: typeof o.tp4 === 'number' ? (o.tp4 as number) : undefined,
      tp1IsHit: typeof o.tp1IsHit === 'boolean' ? (o.tp1IsHit as boolean) : undefined,
      tp2IsHit: typeof o.tp2IsHit === 'boolean' ? (o.tp2IsHit as boolean) : undefined,
      tp3IsHit: typeof o.tp3IsHit === 'boolean' ? (o.tp3IsHit as boolean) : undefined,
      tp4IsHit: typeof o.tp4IsHit === 'boolean' ? (o.tp4IsHit as boolean) : undefined,
      margin: typeof o.margin === 'number' ? (o.margin as number) : undefined,
      leverage: typeof o.leverage === 'number' ? (o.leverage as number) : undefined,
      analysisId: typeof o.analysisId === 'string' ? (o.analysisId as string) : undefined,
      userId,
    };
  }

  if (isObject(obj)) {
    const o = obj as Record<string, unknown>;
    return {
      id: String(o.id),
      market: (o.market as RepoTrade['market']) ?? 'All',
      symbol: String(o.symbol),
      entryDate: String(o.entryDate ?? new Date().toISOString()),
      confluence: (o.confluence as { timeframe?: string; type: string }[] | undefined) ?? undefined,
      size: Number(o.size as number),
      price: Number(o.price as number),
      side: (o.side as RepoTrade['side']) ?? 'LONG',
      status: (o.status as RepoTrade['status']) ?? 'OPEN',
      pnl: typeof o.pnl === 'number' ? (o.pnl as number) : 0,
      notes: o.notes as string | undefined,
      entry: o.entry as string | undefined,
      sl: typeof o.sl === 'number' ? (o.sl as number) : undefined,
      isShortTerm: typeof o.isShortTerm === 'boolean' ? (o.isShortTerm as boolean) : undefined,
      slIsBE: typeof o.slIsBE === 'boolean' ? (o.slIsBE as boolean) : undefined,
      tp1: typeof o.tp1 === 'number' ? (o.tp1 as number) : undefined,
      tp2: typeof o.tp2 === 'number' ? (o.tp2 as number) : undefined,
      tp3: typeof o.tp3 === 'number' ? (o.tp3 as number) : undefined,
      tp4: typeof o.tp4 === 'number' ? (o.tp4 as number) : undefined,
      tp1IsHit: typeof o.tp1IsHit === 'boolean' ? (o.tp1IsHit as boolean) : undefined,
      tp2IsHit: typeof o.tp2IsHit === 'boolean' ? (o.tp2IsHit as boolean) : undefined,
      tp3IsHit: typeof o.tp3IsHit === 'boolean' ? (o.tp3IsHit as boolean) : undefined,
      tp4IsHit: typeof o.tp4IsHit === 'boolean' ? (o.tp4IsHit as boolean) : undefined,
      margin: typeof o.margin === 'number' ? (o.margin as number) : undefined,
      leverage: typeof o.leverage === 'number' ? (o.leverage as number) : undefined,
      analysisId: typeof o.analysisId === 'string' ? (o.analysisId as string) : undefined,
      userId,
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
    userId,
  };
}

export class FirebaseTradeRepository implements TradeRepository {
  async save(trade: Trade): Promise<void> {
    const { db } = ensureFirebase();
    const uid = getCurrentUserId();
    if (!uid) throw new Error('Not authenticated');
    const dto = TradeFactory.toDTO(trade);
    const repoTrade = toRepoTrade(dto, uid);
    // Firestore does not allow `undefined` values. Strip them out.
    const sanitized = Object.fromEntries(
      Object.entries(repoTrade).filter(([, v]) => v !== undefined)
    ) as RepoTrade;
    const ref = doc(db, 'users', uid, 'trades', repoTrade.id);
    await setDoc(ref, sanitized);
  }

  async getAll(): Promise<Trade[]> {
    const { db } = ensureFirebase();
    const uid = getCurrentUserId();
    if (!uid) return [];
    const q = query(collection(db, 'users', uid, 'trades'));
    const snap = await getDocs(q);
    const inputs = snap.docs.map((d) => d.data() as RepoTrade);
    return inputs.map((rt) =>
      TradeFactory.create({
        id: rt.id,
            isShortTerm: rt.isShortTerm,
        symbol: rt.symbol,
        confluence: rt.confluence,
        entryDate: rt.entryDate,
        size: rt.size,
        price: rt.price,
        side: rt.side,
        notes: rt.notes,
        market: rt.market,
        sl: rt.sl,
        slIsBE: rt.slIsBE,
        userId: rt.userId,
        tp1: rt.tp1,
        tp2: rt.tp2,
        tp3: rt.tp3,
        tp4: rt.tp4,
        tp1IsHit: rt.tp1IsHit,
        tp2IsHit: rt.tp2IsHit,
        tp3IsHit: rt.tp3IsHit,
        tp4IsHit: rt.tp4IsHit,
        leverage: rt.leverage,
        margin: rt.margin,
        analysisId: rt.analysisId,
        status: rt.status,
      })
    );
  }

  async update(trade: Trade): Promise<void> {
    // Overwrite with full document to keep logic simple
    await this.save(trade);
  }

  async delete(id: string): Promise<void> {
    const { db } = ensureFirebase();
    const uid = getCurrentUserId();
    if (!uid) throw new Error('Not authenticated');
    const ref = doc(db, 'users', uid, 'trades', id);
    await deleteDoc(ref);
  }
}

export default FirebaseTradeRepository;
