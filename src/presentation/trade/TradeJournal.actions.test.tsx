import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TradeJournal } from './TradeJournal';
import { TradeFactory } from '@/domain/trade/entities/TradeFactory';
import type { TradeInput } from '@/domain/trade/entities/TradeFactory';
import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository';

// Ensure matchMedia exists and reports mobile by default for mobile-related tests
function mockMatchMedia(matches: boolean) {
  // minimal stub that supports addEventListener/removeEventListener used in TradeJournal
  window.matchMedia = (query: string) => {
    return {
      media: query,
      matches,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => true,
    } as unknown as MediaQueryList;
  };
}

describe('TradeJournal actions (mobile add and delete/undo)', () => {
  it('opens mobile New Trade modal and adds a trade locally when no repo is provided', async () => {
    mockMatchMedia(true);

    render(<TradeJournal />);

    // Open mobile New Trade sheet
    const newBtn = await screen.findByText(/New Trade/i);
    fireEvent.click(newBtn);

    // Fill required fields in the modal
    const symbolInput = await screen.findByLabelText('Symbol');
    const priceInput = await screen.findByLabelText(/Entry Price \*/i);
    const marginInput = await screen.findByLabelText(/Margin \*/i);
    const leverageInput = await screen.findByLabelText(/Leverage \*/i);
    const sizeInput = await screen.findByLabelText(/Position Size \*/i);
    const slInput = await screen.findByLabelText(/Stop Loss \(SL\) \*/i);

    fireEvent.change(symbolInput, { target: { value: 'MOBILEUSD' } });
    fireEvent.change(priceInput, { target: { value: '1.5' } });
    fireEvent.change(marginInput, { target: { value: '10' } });
    fireEvent.change(leverageInput, { target: { value: '1' } });
    fireEvent.change(sizeInput, { target: { value: '100' } });
    fireEvent.change(slInput, { target: { value: '1.4' } });

    // Click Add in the modal footer (mobile)
    const addBtn = screen.getAllByText(/^Add$/i).find((b) => b.nodeName === 'BUTTON');
    if (!addBtn) throw new Error('Add button not found');
    fireEvent.click(addBtn);

    // After adding, the new trade symbol should appear in the list
    await waitFor(() => expect(screen.getByText(/MOBILEUSD/i)).toBeTruthy());
  });

  it('deletes a trade and allows undo to restore it (with repo)', async () => {
    // create a domain trade to return from repo.getAll
    const dto: TradeInput = {
      id: 'tx-delete-1',
      symbol: 'DELME',
      entryDate: '2025-12-29T12:00',
      size: 100,
      price: 2,
      side: 'LONG',
      status: 'OPEN',
      notes: '',
      market: 'Crypto',
      margin: 10,
      leverage: 1,
    };
    const domainTrade = TradeFactory.create(dto as TradeInput);

    class MockRepo {
      async getAll(): Promise<ReturnType<typeof TradeFactory.create>[]> {
        return [domainTrade];
      }
      async update(t: ReturnType<typeof TradeFactory.create>): Promise<void> {
        void t;
        return Promise.resolve();
      }
      async delete(id: string): Promise<void> {
        void id;
        return Promise.resolve();
      }
      async save(t: ReturnType<typeof TradeFactory.create>): Promise<void> {
        void t;
        return Promise.resolve();
      }
    }

    const repo = new MockRepo();
    // Force non-compact layout so the right-side editor (with Delete) is rendered
    render(<TradeJournal repo={repo as unknown as TradeRepository} forceCompact={false} />);

    // Wait for the list to render the trade
    await waitFor(() => expect(screen.getByText(/DELME/i)).toBeTruthy());

    // Select the item in the list by clicking the listitem button (non-compact view)
    const listItem = screen.getByRole('listitem', { name: /Select DELME/i });
    fireEvent.click(listItem);

    // Click Delete button in the editor (right pane)
    const deleteBtn = await screen.findByRole('button', { name: /Delete/i });
    fireEvent.click(deleteBtn);

    // Confirm dialog should appear; click 'Ja' to confirm
    const confirm = await screen.findByRole('button', { name: /Ja/i });
    fireEvent.click(confirm);

    // After deletion, the item should be removed from the list and undo banner visible
    await waitFor(() => expect(screen.queryByText(/DELME/i)).toBeNull());
    expect(screen.getByText(/Undo/i)).toBeTruthy();

    // Click Undo to restore
    const undoBtn = screen.getByText(/Undo/i);
    fireEvent.click(undoBtn);

    // Item should be back in the list
    await waitFor(() =>
      expect(screen.getByRole('listitem', { name: /Select DELME/i })).toBeTruthy()
    );
  });
});
