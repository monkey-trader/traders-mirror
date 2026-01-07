import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository';
import { Trade } from '@/domain/trade/entities/Trade';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';
import type { TradeInput } from '@/domain/trade/factories/TradeFactory';
import { getDb } from '@/infrastructure/firebase/firebaseClient';
import type { Firestore } from 'firebase/firestore';

export class FirebaseTradeRepository implements TradeRepository {

  async save(trade: Trade): Promise<void> {
    const { collection, doc, setDoc } = await import('firebase/firestore');
    const dto = TradeFactory.toDTO(trade);
    const db: Firestore = await getDb();
    const col = collection(db, 'trades');
    await setDoc(doc(col, dto.id), dto, { merge: true });
  }

  async getAll(): Promise<Trade[]> {
    const { collection, getDocs } = await import('firebase/firestore');
    const db: Firestore = await getDb();
    const col = collection(db, 'trades');
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
      } catch (err) {
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
    const { collection, doc, setDoc } = await import('firebase/firestore');
    const dto = TradeFactory.toDTO(trade);
    const db: Firestore = await getDb();
    const col = collection(db, 'trades');
    await setDoc(doc(col, dto.id), dto, { merge: true });
  }

  async delete(id: string): Promise<void> {
    const { collection, doc, deleteDoc } = await import('firebase/firestore');
    const db: Firestore = await getDb();
    const col = collection(db, 'trades');
    await deleteDoc(doc(col, id));
  }
}

export default FirebaseTradeRepository;
