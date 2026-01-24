import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import RepoSyncStatus from './RepoSyncStatus';

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('RepoSyncStatus interactions', () => {
  it('renders local by default and shows queued when event dispatched', async () => {
    render(<RepoSyncStatus />);

    expect(screen.getByText(/Sync: Local/i)).toBeInTheDocument();

    // dispatch queued
    act(() => {
      globalThis.dispatchEvent(
        new CustomEvent('repo-sync-status', {
          detail: { feature: 'trade', status: 'queued', queuedCount: 3 },
        })
      );
    });

    expect(await screen.findByText(/Sync: Queued 3/)).toBeInTheDocument();
  });

  it('starts syncing on click and responds to online completion', async () => {
    render(<RepoSyncStatus />);

    let forced = false;
    const l = () => (forced = true);
    globalThis.addEventListener('repo-sync-force', l);

    // click to force sync
    act(() => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(forced).toBeTruthy();
    // label should show syncing
    expect(screen.getByText(/Syncing/)).toBeInTheDocument();

    // now simulate remote reporting online with no queued items
    act(() => {
      globalThis.dispatchEvent(
        new CustomEvent('repo-sync-status', { detail: { feature: 'trade', status: 'online' } })
      );
    });

    // the component should now show online label
    expect(await screen.findByText(/Sync: Online/)).toBeInTheDocument();

    globalThis.removeEventListener('repo-sync-force', l);
  });
});
