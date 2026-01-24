import React from 'react';
import { render, screen, act } from '@testing-library/react';
import RepoOutboxBadge from './RepoOutboxBadge';

describe('RepoOutboxBadge', () => {
  it('shows queued count when repo-sync-status events are emitted and hides when zero', async () => {
    render(<RepoOutboxBadge />);

    // initially hidden
    expect(screen.queryByRole('status')).toBeNull();

    // emit status for trades
    const ev1 = new CustomEvent('repo-sync-status', {
      detail: { feature: 'trades', queuedCount: 2 },
    });
    act(() => globalThis.dispatchEvent(ev1));

    expect(await screen.findByText('2')).toBeInTheDocument();

    // add another feature
    const ev2 = new CustomEvent('repo-sync-status', {
      detail: { feature: 'analysis', queuedCount: 3 },
    });
    act(() => globalThis.dispatchEvent(ev2));

    // total should be 5
    expect(await screen.findByText('5')).toBeInTheDocument();

    // set trades to 0 -> total 3
    const ev3 = new CustomEvent('repo-sync-status', {
      detail: { feature: 'trades', queuedCount: 0 },
    });
    act(() => globalThis.dispatchEvent(ev3));

    expect(await screen.findByText('3')).toBeInTheDocument();

    // set analysis to 0 -> hidden
    const ev4 = new CustomEvent('repo-sync-status', {
      detail: { feature: 'analysis', queuedCount: 0 },
    });
    act(() => globalThis.dispatchEvent(ev4));

    expect(screen.queryByRole('status')).toBeNull();
  });
});
