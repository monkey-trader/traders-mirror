import React, { useRef } from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useTradesViewModel } from './useTradesViewModel';
import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository';
import type { TradeRow } from '@/presentation/trade/types';

function Host({ repo }: { repo?: Partial<TradeRepository> }) {
  const repoRef = useRef<TradeRepository | null>((repo as TradeRepository) ?? null);
  const vm = useTradesViewModel({ repoRef });
  // expose inside DOM for assertions
  return (
    <div>
      <button
        onClick={() =>
          vm.setPositions([
            {
              id: '1',
              market: 'Crypto',
              symbol: 'SOL',
              entryDate: '2025-12-30T19:59',
              size: 111,
              price: 11,
              side: 'LONG',
              status: 'OPEN',
              pnl: 0,
            } as TradeRow,
          ])
        }
      >
        seed
      </button>
      <button onClick={() => vm.performAction('toggle-side', '1')}>toggle</button>
      <button onClick={() => vm.performAction('sl-be', '1')}>sl-be</button>
      <button onClick={() => vm.performAction('delete', '1')}>delete</button>
      <div data-testid="count">{vm.positions.length}</div>
    </div>
  );
}

describe('useTradesViewModel', () => {
  it('toggle-side updates side and persists via repo.update', async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const repo = { update } as unknown as Partial<TradeRepository>;
    render(<Host repo={repo} />);

    // seed
    await act(async () => {
      screen.getByText('seed').click();
    });
    expect(screen.getByTestId('count').textContent).toBe('1');

    await act(async () => {
      screen.getByText('toggle').click();
    });
    // allow async persist to run
    await waitFor(() => {
      expect(update).toHaveBeenCalled();
    });
  });

  it('sl-be sets sl and persists', async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const repo = { update } as unknown as Partial<TradeRepository>;
    render(<Host repo={repo} />);

    await act(async () => {
      screen.getByText('seed').click();
    });

    await act(async () => {
      screen.getByText('sl-be').click();
    });

    await waitFor(() => {
      expect(update).toHaveBeenCalled();
    });
  });

  it('delete removes position and calls repo.delete', async () => {
    const del = vi.fn().mockResolvedValue(undefined);
    const repo = { delete: del } as unknown as Partial<TradeRepository>;
    render(<Host repo={repo} />);

    await act(async () => {
      screen.getByText('seed').click();
    });
    expect(screen.getByTestId('count').textContent).toBe('1');

    await act(async () => {
      screen.getByText('delete').click();
    });

    await waitFor(() => {
      expect(del).toHaveBeenCalled();
    });
  });
});
