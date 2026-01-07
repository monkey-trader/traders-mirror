/**
 * Remove all undefined fields from an object (shallow).
 * @param obj The object to clean.
 * @returns A new object without undefined fields.
 */
function removeUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}
import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository';
import { Trade } from '@/domain/trade/entities/Trade';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';
import type { TradeInput } from '@/domain/trade/factories/TradeFactory';
import { getDb } from '@/infrastructure/firebase/firebaseClient';
import { getCurrentUser } from '@/infrastructure/firebase/firebaseAuth';
import type { Firestore } from 'firebase/firestore';

const firebaseDebug = typeof import.meta !== 'undefined' && import.meta.env.VITE_DEBUG_FIREBASE === 'true';

export class FirebaseTradeRepository implements TradeRepository {

  async save(trade: Trade): Promise<void> {
    const { collection, doc, setDoc } = await import('firebase/firestore');
    let dto = TradeFactory.toDTO(trade);
    const user = getCurrentUser();
    if (user && user.uid) {
      dto.userId = user.uid;
    }
    dto = removeUndefined(dto);
    const db: Firestore = await getDb();
    const col = collection(db, 'trades');
    if (firebaseDebug) {
      // eslint-disable-next-line no-console
      console.debug('[Firebase][Trade] save', { id: dto.id });
    }
    await setDoc(doc(col, dto.id), dto, { merge: true });
  }

  async getAll(): Promise<Trade[]> {
    const { collection, getDocs } = await import('firebase/firestore');
    const db: Firestore = await getDb();
    const col = collection(db, 'trades');
    if (firebaseDebug) {
      // eslint-disable-next-line no-console
      console.debug('[Firebase][Trade] getAll');
    }
    const snap = await getDocs(col);
    const trades = snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      const input = {
        id: d.id,
        symbol: String(data.symbol ?? ''),
        entryDate: String(data.entryDate ?? new Date().toISOString()),
        size: Number(data.size ?? 0),
        price: Number(data.price ?? 0),
        side: String(data.side ?? 'LONG'),
        status: data.status as 'OPEN' | 'CLOSED' | 'FILLED' | undefined,
        notes: typeof data.notes === 'string' ? (data.notes as string) : undefined,
        market: typeof data.market === 'string' ? (data.market as string) : undefined,
        sl: typeof data.sl === 'number' ? (data.sl as number) : undefined,
        tp1: typeof data.tp1 === 'number' ? (data.tp1 as number) : undefined,
        tp2: typeof data.tp2 === 'number' ? (data.tp2 as number) : undefined,
        tp3: typeof data.tp3 === 'number' ? (data.tp3 as number) : undefined,
        tp4: typeof data.tp4 === 'number' ? (data.tp4 as number) : undefined,
        leverage: typeof data.leverage === 'number' ? (data.leverage as number) : undefined,
        margin: typeof data.margin === 'number' ? (data.margin as number) : undefined,
        analysisId: typeof data.analysisId === 'string' ? (data.analysisId as string) : undefined,
      };
      try {
        return TradeFactory.create(input as TradeInput);
      } catch {
        // Fallback: create minimal Trade if conversion fails
        const fallback: TradeInput = {
          id: String(d.id),
          symbol: input.symbol || 'UNKNOWN',
          size: input.size || 0,
          price: input.price || 0,
          side: (input.side as string) || 'LONG',
        };
        return TradeFactory.create(fallback);
      }
    });
    return trades;
  }

  async update(trade: Trade): Promise<void> {
    const { collection, doc, getDoc, setDoc } = await import('firebase/firestore');
    let dto = TradeFactory.toDTO(trade);
    const user = getCurrentUser();
    if (user && user.uid) {
      dto.userId = user.uid;
    }
    dto = removeUndefined(dto);
    const db: Firestore = await getDb();
    const col = collection(db, 'trades');
    // Only allow update if userId matches
    const ref = doc(col, dto.id);
    const snap = await getDoc(ref);
    const data = snap.data() as { userId?: string } | undefined;
    if (!snap.exists() || !user || !data || data.userId !== user.uid) {
      throw new Error('Not authorized to update this trade');
    }
    if (firebaseDebug) {
      // eslint-disable-next-line no-console
      console.debug('[Firebase][Trade] update', { id: dto.id });
    }
    await setDoc(ref, dto, { merge: true });
  }

  async delete(id: string): Promise<void> {
    const { collection, doc, getDoc, deleteDoc } = await import('firebase/firestore');
    const db: Firestore = await getDb();
    const col = collection(db, 'trades');
    const user = getCurrentUser();
    if (firebaseDebug) {
      // eslint-disable-next-line no-console
      console.debug('[Firebase][Trade] delete', { id, userId: user?.uid });
    }
    // Only allow delete if userId matches
    const ref = doc(col, id);
    const snap = await getDoc(ref);
    const data = snap.data() as { userId?: string } | undefined;
    if (!snap.exists() || !user || !data || data.userId !== user.uid) {
      throw new Error('Not authorized to delete this trade');
    }
    await deleteDoc(ref);
  }
}

export default FirebaseTradeRepository;
