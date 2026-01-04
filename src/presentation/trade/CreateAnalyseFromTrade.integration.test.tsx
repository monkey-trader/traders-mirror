import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TradeJournal } from '@/presentation/trade/TradeJournal';
import { LocalStorageTradeRepository } from '@/infrastructure/trade/repositories/LocalStorageTradeRepository';

// Integration test: Create Analyse from Trade Detail -> prefill AddPanel -> save -> link trade

describe('Create Analyse from Trade flow', () => {
  it('prefills Add Analysis and links created analysis to trade', async () => {
    // mock ResizeObserver (used by TradeJournal layout code)
    class FakeResizeObserver {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).ResizeObserver = FakeResizeObserver;

    const tradeRepo = new LocalStorageTradeRepository(undefined, { seedDefaults: true });
    render(<TradeJournal repo={tradeRepo} />);

    // wait for the component to mount and trades to render
    await screen.findByText(/Trading Journal/i);

    // click the expand/details button for the first trade to open the detail view
    const expandBtn = await screen.findByRole('button', { name: /Toggle details for/i });
    fireEvent.click(expandBtn);

    // After expanding, click the 'Show details' button to open the editor
    const showDetails = await screen.findByText('Show details');
    fireEvent.click(showDetails);

    // Click Create Analyse button in detail view
    const createBtn = await screen.findByText('Create Analyse');
    fireEvent.click(createBtn);

    // The AddPanel should open the Analysis editor
    await screen.findByTestId('analysis-editor');

    // The symbol input should be prefilled
    const symbolInput = screen.getByLabelText('Symbol') as HTMLInputElement;
    expect(symbolInput.value).toBeTruthy();

    // Click Save on Analysis editor
    const saveBtn = screen.getByText('Save');
    fireEvent.click(saveBtn);

    // Wait for persistence to complete and the trade to be linked
    await waitFor(() => {
      const raw2 = window.localStorage.getItem('mt_trades_v1');
      expect(raw2).toBeTruthy();
      const parsed2 = JSON.parse(raw2 as string);
      expect(Array.isArray(parsed2)).toBe(true);
      expect(parsed2[0].analysisId).toBeTruthy();
    });
  });
});
