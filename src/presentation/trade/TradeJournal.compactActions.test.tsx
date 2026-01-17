import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TradeJournal } from './TradeJournal';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';
import type { TradeInput } from '@/domain/trade/factories/TradeFactory';

describe('TradeJournal compact dropdown actions', () => {
  it('executes compact action buttons and shows undo banner each time', async () => {
    const dto: TradeInput = {
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
    const domainTrade = TradeFactory.create(dto as TradeInput);

    class MockRepo {
      async getAll(): Promise<ReturnType<typeof TradeFactory.create>[]> {
        return [domainTrade];
      }
      async update(_t: ReturnType<typeof TradeFactory.create>): Promise<void> {
        void _t;
        return Promise.resolve();
      }
      async delete(_id: string): Promise<void> {
        void _id;
        return Promise.resolve();
      }
      async save(_t: ReturnType<typeof TradeFactory.create>): Promise<void> {
        void _t;
        return Promise.resolve();
      }
    }

    const repo = new MockRepo();
    // Force compact grid so PositionCard actions are visible inline
    render(
      <TradeJournal
        repo={
          repo as unknown as import('@/domain/trade/interfaces/TradeRepository').TradeRepository
        }
        forceCompact={true}
      />
    );

    // Wait for the compact item to render
    await waitFor(() => expect(screen.getByText(/COMPACT/i)).toBeTruthy());

    const actionSelect = screen.getByLabelText(/Aktionen für COMPACT/i) as HTMLSelectElement;

    // toggle-side
    fireEvent.change(actionSelect, { target: { value: 'toggle-side' } });
    await waitFor(() => expect(screen.getByText(/Undo/i)).toBeTruthy());
    fireEvent.click(screen.getByText(/Undo/i));

    // set SL to BE
    fireEvent.change(actionSelect, { target: { value: 'sl-be' } });
    await waitFor(() => expect(screen.getByText(/Undo/i)).toBeTruthy());
    fireEvent.click(screen.getByText(/Undo/i));

    // set SL hit
    fireEvent.change(actionSelect, { target: { value: 'sl-hit' } });
    await waitFor(() => expect(screen.getByText(/Undo/i)).toBeTruthy());
    fireEvent.click(screen.getByText(/Undo/i));

    // mark closed
    fireEvent.change(actionSelect, { target: { value: 'status-closed' } });
    await waitFor(() => expect(screen.getByText(/Undo/i)).toBeTruthy());
    fireEvent.click(screen.getByText(/Undo/i));

    // mark open
    fireEvent.change(actionSelect, { target: { value: 'status-open' } });
    await waitFor(() => expect(screen.getByText(/Undo/i)).toBeTruthy());
    fireEvent.click(screen.getByText(/Undo/i));

    // close (mark filled)
    fireEvent.change(actionSelect, { target: { value: 'filled' } });
    await waitFor(() => expect(screen.getByText(/Undo/i)).toBeTruthy());
  });
});
