import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TradeJournal } from './TradeJournal';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';
import type { TradeInput } from '@/domain/trade/factories/TradeFactory';

async function findEditorActionTrigger(symbol: string) {
  const triggers = await screen.findAllByRole('button', {
    name: new RegExp(`Open actions for ${symbol}`, 'i'),
  });
  return (
    triggers.find((btn) =>
      (btn.getAttribute('aria-controls') ?? '').startsWith('trade-quick-actions-')
    ) ?? triggers[0]
  );
}

describe('TradeJournal compact actions (toggle-side, sl-be, sl-hit, close)', () => {
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
    // Force compact grid so compact editor renders below the list
    render(
      <TradeJournal
        repo={
          repo as unknown as import('@/domain/trade/interfaces/TradeRepository').TradeRepository
        }
        forceCompact={true}
      />
    );

    // Wait for the compact item to render and select it to open the editor
    const selectCard = await screen.findByLabelText(/^Select COMPACT$/i);
    fireEvent.click(selectCard);

    const actionsTrigger = await findEditorActionTrigger('COMPACT');

    // toggle-side
    fireEvent.click(actionsTrigger);
    const toggleBtn = await screen.findByRole('menuitem', { name: /Toggle side for COMPACT/i });
    fireEvent.click(toggleBtn);
    await waitFor(() => expect(screen.getByText(/Undo/i)).toBeTruthy());
    fireEvent.click(screen.getByText(/Undo/i));

    // set SL to BE
    fireEvent.click(actionsTrigger);
    const slbeBtn = await screen.findByRole('menuitem', { name: /Set SL to BE for COMPACT/i });
    fireEvent.click(slbeBtn);
    await waitFor(() => expect(screen.getByText(/Undo/i)).toBeTruthy());
    fireEvent.click(screen.getByText(/Undo/i));

    // set SL hit
    fireEvent.click(actionsTrigger);
    const slhitBtn = await screen.findByRole('menuitem', { name: /Set SL hit for COMPACT/i });
    fireEvent.click(slhitBtn);
    await waitFor(() => expect(screen.getByText(/Undo/i)).toBeTruthy());
    fireEvent.click(screen.getByText(/Undo/i));

    // close
    fireEvent.click(actionsTrigger);
    const closeBtn = await screen.findByRole('menuitem', { name: /Filled COMPACT/i });
    fireEvent.click(closeBtn);
    await waitFor(() => expect(screen.getByText(/Undo/i)).toBeTruthy());
  });
});
