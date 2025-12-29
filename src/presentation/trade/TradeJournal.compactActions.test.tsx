import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TradeJournal } from './TradeJournal';
import { TradeFactory } from '@/domain/trade/entities/TradeFactory';

describe('TradeJournal compact actions (toggle-side, sl-be, sl-hit, close)', () => {
  it('executes compact action buttons and shows undo banner each time', async () => {
    const dto = {
      id: 'tx-compact-1',
      symbol: 'COMPACT',
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
    const domainTrade = TradeFactory.create(dto as any);

    class MockRepo {
      async getAll() {
        return [domainTrade];
      }
      async update(_t: any) {
        return Promise.resolve();
      }
      async delete(_id: string) {
        return Promise.resolve();
      }
      async save(_t: any) {
        return Promise.resolve();
      }
    }

    const repo = new MockRepo();
    // Force compact grid so PositionCard actions are visible inline
    render(<TradeJournal repo={repo as any} forceCompact={true} />);

    // Wait for the compact item to render
    await waitFor(() => expect(screen.getByText(/COMPACT/i)).toBeTruthy());

    // toggle-side
    const toggleBtn = screen.getByLabelText(/Toggle side for COMPACT/i);
    fireEvent.click(toggleBtn);
    await waitFor(() => expect(screen.getByText(/Undo/i)).toBeTruthy());
    fireEvent.click(screen.getByText(/Undo/i));

    // set SL to BE
    const slbeBtn = screen.getByLabelText(/Set SL to BE for COMPACT/i);
    fireEvent.click(slbeBtn);
    await waitFor(() => expect(screen.getByText(/Undo/i)).toBeTruthy());
    fireEvent.click(screen.getByText(/Undo/i));

    // set SL hit
    const slhitBtn = screen.getByLabelText(/Set SL hit for COMPACT/i);
    fireEvent.click(slhitBtn);
    await waitFor(() => expect(screen.getByText(/Undo/i)).toBeTruthy());
    fireEvent.click(screen.getByText(/Undo/i));

    // close
    const closeBtn = screen.getByLabelText(/Close COMPACT/i);
    fireEvent.click(closeBtn);
    await waitFor(() => expect(screen.getByText(/Undo/i)).toBeTruthy());
  });
});
