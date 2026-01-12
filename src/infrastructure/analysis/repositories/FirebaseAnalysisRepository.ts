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
    await setDoc(doc(db, 'analyses', analysis.id), data);
  }

  async getById(id: string): Promise<AnalysisDTO | null> {
    const { db } = ensureFirebase();
    const uid = getCurrentUserId();
    if (!uid) return null;
    const ref = doc(db, 'analyses', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as RepoAnalysis;
    if (data.userId !== uid) return null;
    const { userId: _userId, ...dto } = data;
    return dto;
  }

  async listBySymbol(symbol: string): Promise<AnalysisDTO[]> {
    const { db } = ensureFirebase();
    const uid = getCurrentUserId();
    if (!uid) return [];
    const q = query(collection(db, 'analyses'), where('userId', '==', uid), where('symbol', '==', symbol));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const { userId: _userId, ...dto } = d.data() as RepoAnalysis;
      return dto;
    });
  }

  async listAll(): Promise<AnalysisDTO[]> {
    const { db } = ensureFirebase();
    const uid = getCurrentUserId();
    if (!uid) return [];
    const q = query(collection(db, 'analyses'), where('userId', '==', uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const { userId: _userId, ...dto } = d.data() as RepoAnalysis;
      return dto;
    });
  }

  async delete(id: string): Promise<void> {
    const { db } = ensureFirebase();
    const uid = getCurrentUserId();
    if (!uid) throw new Error('Not authenticated');
    await deleteDoc(doc(db, 'analyses', id));
  }

  async clear(): Promise<void> {
    const { db } = ensureFirebase();
    const uid = getCurrentUserId();
    if (!uid) return;
    const q = query(collection(db, 'analyses'), where('userId', '==', uid));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  }
}

export default FirebaseAnalysisRepository;
