import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Analysis } from './Analysis';

// Helper to set localStorage for analyses
const STORAGE_KEY = 'analyses_v1';

describe('Analysis live refresh', () => {
  it('reloads list when analyses-updated event is dispatched', async () => {
    // Ensure starting empty
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }

    render(<Analysis />);

    // Initially: empty state shown
    const empty = await screen.findByText(/Keine Analysen vorhanden/i);
    expect(empty).toBeTruthy();

    // Write one analysis into localStorage that listAll() can read
    const dto = {
      id: 'A1',
      symbol: 'EURUSD',
      createdAt: new Date().toISOString(),
      market: 'Forex',
      timeframes: {
        daily: { timeframe: 'daily', tradingViewLink: 'https://tv.example', note: 'D' },
        weekly: { timeframe: 'weekly', note: 'W' },
      },
      notes: 'Breakout setup',
    };
    try {
      const existingRaw = window.localStorage.getItem(STORAGE_KEY);
      const list = existingRaw ? JSON.parse(existingRaw) : [];
      list.push(dto);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }

    // Dispatch repository update event that Analysis listens to
    try {
      globalThis.dispatchEvent(new CustomEvent('analyses-updated', { detail: { type: 'created', id: 'A1' } }));
    } catch {
      /* ignore */
    }

    // Expect the list to render the new analysis without manual refresh
    await waitFor(() => {
      expect(screen.getByRole('list')).toBeTruthy();
      expect(screen.getByText('EURUSD')).toBeTruthy();
    });
  });
});
