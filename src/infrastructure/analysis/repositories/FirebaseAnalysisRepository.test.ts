import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/firestore', () => {
  const mockGetFirestore = vi.fn(() => ({}));
  const mockSetDoc = vi.fn(async () => Promise.resolve());
  const mockGetDocs = vi.fn(async () => Promise.resolve({ docs: [] }));
  const mockDeleteDoc = vi.fn(async () => Promise.resolve());
  // getDoc returns a mock snapshot with .exists() and .data()
  const mockGetDoc = vi.fn(async () => ({
    exists: () => true,
    data: () => ({ userId: 'mock-user' }),
    id: 'mock-id',
  }));
  const mockDoc = vi.fn((col: unknown, id: string) => ({ id }));
  const collection = (db: unknown, name: string) => ({ _name: name });
  const query = (col: unknown, _where: unknown) => ({ _q: col });
  const where = (_field: string, _op: string, _val: unknown) => ({ _w: true });
  return {
    getFirestore: mockGetFirestore,
    collection,
    doc: mockDoc,
    setDoc: mockSetDoc,
    getDocs: mockGetDocs,
    deleteDoc: mockDeleteDoc,
    query,
    where,
    getDoc: mockGetDoc,
  };
});


vi.mock('@/infrastructure/firebase/firebaseAuth', () => ({
  getCurrentUser: () => ({ uid: 'mock-user' })
}));

import FirebaseAnalysisRepository from './FirebaseAnalysisRepository';

let fs: any;

describe('FirebaseAnalysisRepository', () => {
  beforeEach(async () => {
    fs = await import('firebase/firestore');
    if (fs.getFirestore && fs.getFirestore.mockReset) fs.getFirestore.mockReset();
    fs.setDoc.mockReset();
    fs.getDocs.mockReset();
    fs.deleteDoc.mockReset();
    fs.getDoc.mockReset();
    fs.doc.mockReset();
  });

  it('save calls setDoc with dto id', async () => {
    const repo = new FirebaseAnalysisRepository();
    const dto = { id: 'a-save', symbol: 'BTCUSD', createdAt: new Date().toISOString(), timeframes: { daily: { timeframe: 'daily' } } };
    await repo.save(dto as any);
    expect(fs.setDoc).toHaveBeenCalled();
  });

  it('listAll maps documents to DTOs', async () => {
    fs.getDocs.mockResolvedValueOnce({ docs: [{ id: 'a1', data: () => ({ symbol: 'BTCUSD', createdAt: new Date().toISOString(), timeframes: { daily: { timeframe: 'daily' } } }) }] });
    const repo = new FirebaseAnalysisRepository();
    const list = await repo.listAll();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(1);
  });

  it('getById returns null when not exists', async () => {
    fs.getDoc.mockResolvedValueOnce({ exists: false });
    const repo = new FirebaseAnalysisRepository();
    const res = await repo.getById('nope');
    expect(res).toBeNull();
  });

  it('delete calls deleteDoc', async () => {
    const repo = new FirebaseAnalysisRepository();
    await repo.delete('a-del');
    expect(fs.deleteDoc).toHaveBeenCalled();
  });

  it('listBySymbol uses query and returns results', async () => {
    fs.getDocs.mockResolvedValueOnce({ docs: [{ id: 's1', data: () => ({ symbol: 'X1', createdAt: new Date().toISOString(), timeframes: { daily: { timeframe: 'daily' } } }) }] });
    const repo = new FirebaseAnalysisRepository();
    const res = await repo.listBySymbol('X1');
    expect(res.length).toBe(1);
  });
});
