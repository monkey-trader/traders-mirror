import { describe, it, expect, vi, beforeEach } from 'vitest';
import HybridAnalysisRepository from './HybridAnalysisRepository';

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

describe('HybridAnalysisRepository', () => {
  it('delete clears analysisId from trades and dispatches trades-updated', async () => {
    const initialTrades = [
      {
        id: 't1',
        market: 'Crypto',
        symbol: 'ETHUSD',
        entryDate: '2025-12-21T10:12:00Z',
        size: 1,
        price: 100,
        side: 'LONG',
        status: 'OPEN',
        pnl: 0,
        analysisId: 'A1',
      },
    ];
    localStorage.setItem('mt_trades_v1', JSON.stringify(initialTrades));

    const handler = vi.fn();
    globalThis.addEventListener('trades-updated', handler as EventListener);

    const repo = new HybridAnalysisRepository();
    await repo.delete('A1');

    const persistedRaw = localStorage.getItem('mt_trades_v1');
    const persisted = persistedRaw ? JSON.parse(persistedRaw) : [];

    expect(persisted.length).toBe(1);
    expect(persisted[0].analysisId).toBeUndefined();
    expect(handler).toHaveBeenCalled();

    globalThis.removeEventListener('trades-updated', handler as EventListener);
  });
});
