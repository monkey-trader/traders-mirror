import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { RepoSyncStatus } from './RepoSyncStatus';
import type { RepoSyncEventDetail } from './RepoSyncStatus';

function dispatch(detail: RepoSyncEventDetail) {
  globalThis.dispatchEvent(new CustomEvent('repo-sync-status', { detail }));
}

describe('RepoSyncStatus', () => {
  it('renders Local by default', () => {
    render(<RepoSyncStatus />);
    expect(screen.getByText(/Sync: Local/i)).toBeInTheDocument();
  });

  it('shows Online when any feature is online', async () => {
    render(<RepoSyncStatus />);
    dispatch({ feature: 'trade', status: 'online' });
    expect(await screen.findByText(/Sync: Online/i)).toBeInTheDocument();
  });

  it('shows Queued when any feature has queued items', async () => {
    render(<RepoSyncStatus />);
    dispatch({ feature: 'analysis', status: 'queued', queuedCount: 2 });
    expect(await screen.findByText(/Sync: Queued 2/i)).toBeInTheDocument();
  });

  it('applies compact styles when compactView is true', () => {
    const { container } = render(<RepoSyncStatus compactView />);
    const chip = container.querySelector('span');
    expect(chip?.className).toMatch(/compact/);
  });
});
