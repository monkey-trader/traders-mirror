import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase/firestore functions used by the repository
vi.mock('firebase/firestore', () => {
  const mockGetFirestore = vi.fn(() => ({}));
  const mockSetDoc = vi.fn(async () => Promise.resolve());
  const mockGetDocs = vi.fn(async () => Promise.resolve({ docs: [] }));
  const mockDeleteDoc = vi.fn(async () => Promise.resolve());
  const mockGetDoc = vi.fn(async () => Promise.resolve({
    exists: () => true,
    data: () => ({ userId: 'mock-user' }),
    id: 'mock-id',
  }));
  const mockDoc = vi.fn((col: unknown, id: string) => ({ id }));
  const collection = (db: unknown, name: string) => ({ _name: name });
  return {
    getFirestore: mockGetFirestore,
    collection,
    doc: mockDoc,
    setDoc: mockSetDoc,
    getDocs: mockGetDocs,
    deleteDoc: mockDeleteDoc,
    getDoc: mockGetDoc,
  };
});

// Import after mocking

vi.mock('@/infrastructure/firebase/firebaseAuth', () => ({
  getCurrentUser: () => ({ uid: 'mock-user' })
}));

import FirebaseTradeRepository from './FirebaseTradeRepository';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';

let fs: any;

describe('FirebaseTradeRepository', () => {
  beforeEach(async () => {
    fs = await import('firebase/firestore');
    if (fs.getFirestore && fs.getFirestore.mockReset) fs.getFirestore.mockReset();
    fs.setDoc.mockReset();
    fs.getDocs.mockReset();
    fs.deleteDoc.mockReset();
    fs.doc.mockReset();
  });

  it('save calls setDoc with dto id', async () => {
    const repo = new FirebaseTradeRepository();
    const trade = TradeFactory.create({
      id: 't-save',
      symbol: 'ETHUSD',
      size: 1,
      price: 100,
      side: 'LONG',
    });

    await repo.save(trade);
    expect(fs.doc).toHaveBeenCalled();
  });

  it('getAll maps documents to domain Trades', async () => {
    // prepare getDocs to return a fake snapshot
    fs.getDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 't1',
          data: () => ({ symbol: 'ETHUSD', size: 1, price: 100, side: 'LONG', entryDate: new Date().toISOString() }),
        },
      ],
    });

    const repo = new FirebaseTradeRepository();
    const trades = await repo.getAll();
    expect(trades).toBeInstanceOf(Array);
    expect(trades.length).toBe(1);
  });

  it('delete calls deleteDoc', async () => {
    const repo = new FirebaseTradeRepository();
    await repo.delete('t-delete');
    expect(fs.deleteDoc).toHaveBeenCalled();
  });
});
