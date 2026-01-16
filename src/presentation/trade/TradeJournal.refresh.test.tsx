import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { TradeJournal } from './TradeJournal';
import LocalStorageTradeRepository from '@/infrastructure/trade/repositories/LocalStorageTradeRepository';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';

const STORAGE_KEY = 'mt_trades_v1';

describe('TradeJournal live refresh', () => {
  it('reloads trades when trades-updated event is dispatched', async () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore localStorage removal errors in some environments (e.g. restricted test runners)
    }

    // Render with a LocalStorage repo injected
    const repo = new LocalStorageTradeRepository(STORAGE_KEY, { seedDefaults: false });
    render(<TradeJournal repo={repo} />);

    // Initially: Trade list container rendered
    const listEl = await screen.findByRole('list');
    expect(listEl).toBeTruthy();

    // Persist a trade and then dispatch trades-updated
    const dto = {
      id: 'T-J-1',
      symbol: 'BTCUSD',
      entryDate: new Date().toISOString(),
      size: 0.1,
      price: 42000,
      side: 'LONG',
    };
    const domain = TradeFactory.create(dto);
    await repo.save(domain);

    try {
      globalThis.dispatchEvent(
        new CustomEvent('trades-updated', { detail: { type: 'created', id: 'T-J-1' } })
      );
    } catch {
      // ignore if dispatch isn't allowed in some runtimes
    }

    await waitFor(() => {
      // TradeList renders the symbol
      expect(screen.getByText('BTCUSD')).toBeTruthy();
    });
  });
});
