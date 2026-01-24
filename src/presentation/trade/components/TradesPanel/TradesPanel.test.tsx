import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TradesPanel from './TradesPanel';
import type { TradeRow } from '../../types';

const tradeListMock = vi.fn(
  (props: {
    trades: TradeRow[];
    onSelect: (id: string) => void;
    onInlineUpdate?: (id: string, field: string, value: number | string | undefined) => void;
    onDelete?: (id: string) => void;
    compactView?: boolean;
  }) => {
    const { trades, onSelect, onInlineUpdate, onDelete } = props;
    return (
      <div>
        {trades.map((t: TradeRow) => (
          <button key={t.id} onClick={() => onSelect(t.id)}>
            {t.symbol}
          </button>
        ))}
        <button onClick={() => onInlineUpdate?.('inline-id', 'price', 123)}>inline-edit</button>
        <button onClick={() => onDelete?.('inline-id')}>inline-delete</button>
      </div>
    );
  }
);

vi.mock('../../TradeList/TradeList', () => ({
  TradeList: (props: any) => tradeListMock(props),
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

  beforeEach(() => {
    tradeListMock.mockClear();
  });

  it('forwards selection and inline update handlers to TradeList', async () => {
    const handleSelect = vi.fn();
    const handleInline = vi.fn();
    const handleDelete = vi.fn();

    render(
      <TradesPanel
        tradeListItems={[baseTrade]}
        selectedId={baseTrade.id}
        onSelect={handleSelect}
        performAction={() => {}}
        performTPHit={() => {}}
        compactGrid={false}
        onInlineUpdate={handleInline}
        onRequestDelete={handleDelete}
      />
    );

    await userEvent.click(screen.getByText('SOL'));
    expect(handleSelect).toHaveBeenCalledWith(baseTrade.id);

    await userEvent.click(screen.getByText('inline-edit'));
    expect(handleInline).toHaveBeenCalledWith('inline-id', 'price', 123);

    await userEvent.click(screen.getByText('inline-delete'));
    expect(handleDelete).toHaveBeenCalledWith('inline-id');
  });

  it('sets compactView on TradeList when compactGrid is true', () => {
    render(
      <TradesPanel
        tradeListItems={[baseTrade]}
        selectedId={null}
        onSelect={() => {}}
        performAction={() => {}}
        performTPHit={() => {}}
        compactGrid={true}
      />
    );

    const lastCall = tradeListMock.mock.calls.at(-1)?.[0];
    expect(lastCall?.compactView).toBe(true);
  });
});
