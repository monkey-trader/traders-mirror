/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { AnalysisDetail } from './AnalysisDetail';
import LocalStorageTradeRepository from '@/infrastructure/trade/repositories/LocalStorageTradeRepository';

const sampleAnalysis = {
  id: 'A-123',
  symbol: 'BTCUSD',
  createdAt: new Date().toISOString(),
  timeframes: {
    daily: { timeframe: 'daily', note: 'note' },
    weekly: { timeframe: 'weekly' },
    monthly: { timeframe: 'monthly' },
    '4h': { timeframe: '4h' },
    '2h': { timeframe: '2h' },
    '1h': { timeframe: '1h' },
    '15min': { timeframe: '15min' },
  },
};

describe('AnalysisDetail open-trade link', () => {
  beforeEach(() => {
    // clear localStorage so no trades exist by default
    localStorage.removeItem('mt_trades_v1');
  });

  afterEach(() => {
    localStorage.removeItem('mt_trades_v1');
  });

  it('does not show Open trade button when no trade exists for analysis', async () => {
    render(<AnalysisDetail analysis={sampleAnalysis as any} />);
    // ensure async effect had time to run
    await waitFor(() => {
      const btn = screen.queryByRole('button', { name: /Open trade for BTCUSD/i });
      expect(btn).toBeNull();
    });
  });

  it('shows Open trade button when a trade linked to the analysis exists', async () => {
    const repo = new LocalStorageTradeRepository(undefined, { seedDefaults: false });
    // seed a repo trade that links to analysis id
    repo.seed([
      {
        id: 't-linked',
        market: 'Crypto',
        symbol: 'BTCUSD',
        entryDate: new Date().toISOString(),
        size: 1,
        price: 10000,
        side: 'LONG',
        status: 'OPEN',
        pnl: 0,
        analysisId: 'A-123',
      },
    ]);

    render(<AnalysisDetail analysis={sampleAnalysis as any} />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Open trade for BTCUSD/i })).toBeTruthy()
    );
  });

  it('clicking Open trade sets hash and dispatches event', async () => {
    const repo = new LocalStorageTradeRepository(undefined, { seedDefaults: false });
    repo.seed([
      {
        id: 't-linked',
        market: 'Crypto',
        symbol: 'BTCUSD',
        entryDate: new Date().toISOString(),
        size: 1,
        price: 10000,
        side: 'LONG',
        status: 'OPEN',
        pnl: 0,
        analysisId: 'A-123',
      },
    ]);

    const dispatchSpy = vi.spyOn(globalThis, 'dispatchEvent');
    render(<AnalysisDetail analysis={sampleAnalysis as any} />);

    await waitFor(() => expect(screen.getByRole('button', { name: /Open trade for BTCUSD/i }))); 

    const btn = screen.getByRole('button', { name: /Open trade for BTCUSD/i });
    btn.click();

    // allow the setTimeout in handler to run and assert dispatch
    await waitFor(() => expect(globalThis.location.hash).toBe('#/journal'));
    await waitFor(() => expect(dispatchSpy).toHaveBeenCalled());
    dispatchSpy.mockRestore();
  });
});
