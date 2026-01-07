import type {
  AnalysisDTO,
  AnalysisRepository,
} from '@/domain/analysis/interfaces/AnalysisRepository';
import { getCurrentUser } from '@/infrastructure/firebase/firebaseAuth';
import { getDb } from '@/infrastructure/firebase/firebaseClient';
import type { Firestore } from 'firebase/firestore';

const firebaseDebug = typeof import.meta !== 'undefined' && import.meta.env.VITE_DEBUG_FIREBASE === 'true';

export class FirebaseAnalysisRepository implements AnalysisRepository {
  // Add or update analysis, always set userId
  async save(analysis: AnalysisDTO): Promise<void> {
    const { collection, doc, setDoc } = await import('firebase/firestore');
    const db: Firestore = await getDb();
    const col = collection(db, 'analyses');
    const user = getCurrentUser();
    const dto = { ...analysis, userId: user?.uid };
    if (firebaseDebug) console.debug('[Firebase][Analysis] save', { id: analysis.id, userId: user?.uid });
    await setDoc(doc(col, analysis.id), dto, { merge: true });
    try {
      globalThis.dispatchEvent(
        new CustomEvent('analyses-updated', { detail: { type: 'created_or_updated', id: analysis.id } })
      );
    } catch {
      // ignore
    }
  }

  // Update analysis: just call save (merge: true)
  async update(analysis: AnalysisDTO): Promise<void> {
    return this.save(analysis);
  }

  async getById(id: string): Promise<AnalysisDTO | null> {
    const { collection, doc, getDoc } = await import('firebase/firestore');
    const db: Firestore = await getDb();
    if (firebaseDebug) console.debug('[Firebase][Analysis] getById', { id });
    const d = await getDoc(doc(collection(db, 'analyses'), id));
    // handle not found shape
    if (!d.exists || typeof d.data !== 'function') return null;
    const data = d.data() as Record<string, unknown>;
    return ({ id: d.id, ...(data as Record<string, string | object>) } as AnalysisDTO) ?? null;
  }

  async listBySymbol(symbol: string): Promise<AnalysisDTO[]> {
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const db: Firestore = await getDb();
    const col = collection(db, 'analyses');
    if (firebaseDebug) console.debug('[Firebase][Analysis] listBySymbol', { symbol });
    const q = query(col, where('symbol', '==', symbol));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as AnalysisDTO));
  }

  async listAll(): Promise<AnalysisDTO[]> {
    const { collection, getDocs } = await import('firebase/firestore');
    const db: Firestore = await getDb();
    const col = collection(db, 'analyses');
    if (firebaseDebug) console.debug('[Firebase][Analysis] listAll');
    const snap = await getDocs(col);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as AnalysisDTO));
  }

  async delete(id: string): Promise<void> {
    const { collection, doc, getDoc, deleteDoc } = await import('firebase/firestore');
    const db: Firestore = await getDb();
    const col = collection(db, 'analyses');
    const user = getCurrentUser();
    if (firebaseDebug) console.debug('[Firebase][Analysis] delete', { id, userId: user?.uid });
    // Only allow delete if userId matches
    const ref = doc(col, id);
    const snap = await getDoc(ref);
    const data = snap.data() as { userId?: string } | undefined;
    if (!snap.exists() || !user || !data || data.userId !== user.uid) {
      throw new Error('Not authorized to delete this analysis');
    }
    await deleteDoc(ref);
    try {
      globalThis.dispatchEvent(new CustomEvent('analyses-updated', { detail: { type: 'deleted', id } }));
    } catch {
      // ignore
    }
  }

  async clear(): Promise<void> {
    // Not supported in Firestore adapter; no-op
    return Promise.resolve();
  }
}

export default FirebaseAnalysisRepository;
