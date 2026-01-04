import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TradeDetailEditor } from '@/presentation/trade/TradeDetail/TradeDetailEditor';

describe('TradeDetailEditor', () => {
  it('dispatches prefill-analysis event when Create Analyse clicked', async () => {
    const trade = {
      id: 't1',
      symbol: 'BTCUSD',
      entryDate: '2025-12-22T11:00',
      size: 0.1,
      price: 42000,
      side: 'LONG',
      market: 'Crypto',
      notes: 'Test notes',
    };

    type PrefillDetail = { tradeId: string; symbol: string; notes?: string; market?: 'Forex' | 'Crypto' | undefined };
    let received: PrefillDetail | null = null;
    const handler = (e: Event) => {
      received = (e as CustomEvent).detail as PrefillDetail;
    };

    globalThis.addEventListener('prefill-analysis', handler as EventListener);
    try {
      render(<TradeDetailEditor trade={trade as unknown as import('@/domain/trade/factories/TradeFactory').TradeInput} />);

      const btn = await screen.findByText('Create Analyse');
      fireEvent.click(btn);

      // Expect an event to have been dispatched with tradeId and symbol
      expect(received).toBeTruthy();
      if (!received) throw new Error('expected received event detail');
      const r = received as PrefillDetail;
      expect(r.tradeId).toBe('t1');
      expect(r.symbol).toBe('BTCUSD');
      expect(r.notes).toBe('Test notes');
      expect(['Forex', 'Crypto', undefined]).toContain(r.market);
    } finally {
      globalThis.removeEventListener('prefill-analysis', handler as EventListener);
    }
  });
});
