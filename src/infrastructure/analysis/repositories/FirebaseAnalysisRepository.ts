import type {
  AnalysisDTO,
  AnalysisRepository,
} from '@/domain/analysis/interfaces/AnalysisRepository';
import { ensureFirebase, getCurrentUserId } from '@/infrastructure/firebase/client';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
} from 'firebase/firestore';

type RepoAnalysis = AnalysisDTO & { userId: string };

export class FirebaseAnalysisRepository implements AnalysisRepository {
  async save(analysis: AnalysisDTO): Promise<void> {
    const { db } = ensureFirebase();
    const uid = getCurrentUserId();
    if (!uid) throw new Error('Not authenticated');
    const data: RepoAnalysis = { ...analysis, userId: uid };
    // Firestore does not allow `undefined` values. Strip them out.
    const sanitized = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    ) as RepoAnalysis;
    // eslint-disable-next-line no-console
    console.info('[FirebaseRepo:Analysis] save', analysis.id, 'symbol=', analysis.symbol);
    await setDoc(doc(db, 'users', uid, 'analyses', analysis.id), sanitized);
  }

  async getById(id: string): Promise<AnalysisDTO | null> {
    const { db } = ensureFirebase();
    const uid = getCurrentUserId();
    if (!uid) return null;
    // eslint-disable-next-line no-console
    console.info('[FirebaseRepo:Analysis] getById', id);
    const ref = doc(db, 'users', uid, 'analyses', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as RepoAnalysis;
    if (data.userId !== uid) return null;
    const dto = { ...data } as Omit<RepoAnalysis, 'userId'>;
    delete (dto as { userId?: string }).userId;
    return dto as AnalysisDTO;
  }

  async listBySymbol(symbol: string): Promise<AnalysisDTO[]> {
    const { db } = ensureFirebase();
    const uid = getCurrentUserId();
    if (!uid) return [];
    // eslint-disable-next-line no-console
    console.info('[FirebaseRepo:Analysis] listBySymbol', symbol);
    const q = query(collection(db, 'users', uid, 'analyses'), where('symbol', '==', symbol));
    const snap = await getDocs(q);
    // eslint-disable-next-line no-console
    console.info('[FirebaseRepo:Analysis] listBySymbol returned', snap.size);
    return snap.docs.map((d) => {
      const src = d.data() as RepoAnalysis;
      const dto = { ...src } as Omit<RepoAnalysis, 'userId'>;
      delete (dto as { userId?: string }).userId;
      return dto as AnalysisDTO;
    });
  }

  async listAll(): Promise<AnalysisDTO[]> {
    const { db } = ensureFirebase();
    const uid = getCurrentUserId();
    if (!uid) return [];
    // eslint-disable-next-line no-console
    console.info('[FirebaseRepo:Analysis] listAll for user', uid);
    const q = query(collection(db, 'users', uid, 'analyses'));
    const snap = await getDocs(q);
    // eslint-disable-next-line no-console
    console.info('[FirebaseRepo:Analysis] listAll returned', snap.size);
    return snap.docs.map((d) => {
      const src = d.data() as RepoAnalysis;
      const dto = { ...src } as Omit<RepoAnalysis, 'userId'>;
      delete (dto as { userId?: string }).userId;
      return dto as AnalysisDTO;
    });
  }

  async delete(id: string): Promise<void> {
    const { db } = ensureFirebase();
    const uid = getCurrentUserId();
    if (!uid) throw new Error('Not authenticated');
    // eslint-disable-next-line no-console
    console.info('[FirebaseRepo:Analysis] delete', id);
    await deleteDoc(doc(db, 'users', uid, 'analyses', id));
  }

  async clear(): Promise<void> {
    const { db } = ensureFirebase();
    const uid = getCurrentUserId();
    if (!uid) return;
    // eslint-disable-next-line no-console
    console.info('[FirebaseRepo:Analysis] clear for user', uid);
    const q = query(collection(db, 'users', uid, 'analyses'));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  }
}

export default FirebaseAnalysisRepository;
