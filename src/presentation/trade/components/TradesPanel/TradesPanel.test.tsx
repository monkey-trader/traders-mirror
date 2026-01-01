import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import TradesPanel from './TradesPanel';
import type { TradeRow } from '../../types';

vi.mock('../../TradeList/TradeList', () => ({
  TradeList: (props: { trades: TradeRow[]; onSelect: (id: string) => void }) => {
    const { trades, onSelect } = props;
    return (
      <div>
        {trades.map((t: TradeRow) => (
          <button key={t.id} onClick={() => onSelect(t.id)}>
            {t.symbol}
          </button>
        ))}
      </div>
    );
  },
}));

vi.mock('../../TradeDetail/TradeDetailEditor', () => ({
  TradeDetailEditor: (props: {
    trade?: TradeRow;
    onSave?: (t: unknown) => Promise<void> | void;
    onDelete?: (id: string) => Promise<void> | void;
  }) => {
    const { trade, onSave, onDelete } = props;
    return (
      <div>
        <div>Editor: {trade?.symbol}</div>
        <button onClick={() => onSave?.(trade)}>save</button>
        <button onClick={() => onDelete?.(trade?.id ?? '')}>delete</button>
      </div>
    );
  },
}));

describe('TradesPanel', () => {
  const baseTrade: TradeRow = {
    id: '1',
    market: 'Crypto',
    symbol: 'SOL',
    entryDate: '2025-12-30T19:59',
    size: 111,
    price: 11,
    side: 'LONG',
    status: 'OPEN',
    pnl: 0,
  };

  it('shows compact summary and opens editor when Show details clicked', async () => {
    const setCompactEditorOpen = vi.fn();
    render(
      <TradesPanel
        tradeListItems={[baseTrade]}
        selectedId={baseTrade.id}
        onSelect={() => {}}
        performAction={() => {}}
        compactGrid={true}
        compactEditorOpen={false}
        setCompactEditorOpen={setCompactEditorOpen}
        selectedTrade={baseTrade}
        onEditorChange={() => {}}
        onEditorSave={async () => {}}
        onDeleteFromEditor={async () => {}}
      />
    );

    const matches = screen.getAllByText('SOL');
    expect(matches.length).toBeGreaterThanOrEqual(1);
    const btn = screen.getByRole('button', { name: /Show details/i });
    await userEvent.click(btn);
    expect(setCompactEditorOpen).toHaveBeenCalledWith(true);
  });

  it('renders TradeDetailEditor when compactEditorOpen is true', () => {
    render(
      <TradesPanel
        tradeListItems={[baseTrade]}
        selectedId={baseTrade.id}
        onSelect={() => {}}
        performAction={() => {}}
        compactGrid={true}
        compactEditorOpen={true}
        setCompactEditorOpen={() => {}}
        selectedTrade={baseTrade}
        onEditorChange={() => {}}
        onEditorSave={async () => {}}
        onDeleteFromEditor={async () => {}}
      />
    );

    expect(screen.getByText(/Editor: SOL/)).toBeTruthy();
  });
});
