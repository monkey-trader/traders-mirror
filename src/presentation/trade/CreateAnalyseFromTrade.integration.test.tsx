import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { TradeJournal } from '@/presentation/trade/TradeJournal';
import { LocalStorageTradeRepository } from '@/infrastructure/trade/repositories/LocalStorageTradeRepository';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';

// Integration test: prefill AddPanel via prefill-analysis event -> save -> link trade

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

    // Simulate a "create analyse" request by dispatching the existing prefill-analysis event
    const domainTrades = await tradeRepo.getAll();
    const tradeDTO = TradeFactory.toDTO(domainTrades[0]);
    await act(async () => {
      globalThis.dispatchEvent(
        new CustomEvent('prefill-analysis', {
          detail: {
            symbol: tradeDTO.symbol,
            notes: 'From compact flow test',
            market: tradeDTO.market,
            tradeId: tradeDTO.id,
          },
        })
      );
    });

    // The AddPanel should switch to the Analysis editor with the trade data prefilled
    await screen.findByTestId('analysis-editor');

    const symbolInput = screen.getByLabelText('Symbol') as HTMLInputElement;
    expect(symbolInput.value).toBe(tradeDTO.symbol);

    // Click Save on Analysis editor
    const saveBtn = screen.getByText('Save');
    fireEvent.click(saveBtn);

    // Wait for persistence to complete and the trade to be linked
    await waitFor(() => {
      const raw2 = window.localStorage.getItem('mt_trades_v1');
      expect(raw2).toBeTruthy();
      const parsed2 = JSON.parse(raw2 as string);
      expect(Array.isArray(parsed2)).toBe(true);
      const linked = parsed2.find((t: { id: string }) => t.id === tradeDTO.id);
      expect(linked?.analysisId).toBeTruthy();
    });
  });
});
