/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

// Ensure tests use a deterministic loadSettings implementation that reads from localStorage
vi.mock('@/presentation/settings/settingsStorage', () => ({
  SETTINGS_KEY: 'mt_user_settings_v1',
  loadSettings: () => {
    try {
      const raw = window.localStorage.getItem('mt_user_settings_v1');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },
}));

const SETTINGS_KEY = 'mt_user_settings_v1';
import { TradeJournal } from './TradeJournal';

const noopRepo = {
  getAll: async () => [],
  save: async () => undefined,
  update: async () => undefined,
  delete: async () => undefined,
};

describe('TradeJournal (unit)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    window.localStorage.removeItem(SETTINGS_KEY);
  });

  it('shows Load mock data button when settings allow and opens modal on click', async () => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ showLoadMockButton: true }));

    render(<TradeJournal repo={noopRepo as any} />);

    const loadButton = await screen.findByText('Load mock data');
    expect(loadButton).toBeTruthy();

    // click should open the MockLoaderModal which renders the dialog heading
    fireEvent.click(loadButton);
    const dialogHeading = await screen.findByText('Lade Mock-Daten');
    expect(dialogHeading).toBeTruthy();
  });

  it('hides Load mock data button when settings disable it', async () => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ showLoadMockButton: false }));

    render(<TradeJournal repo={noopRepo as any} />);

    const maybe = screen.queryByText('Load mock data');
    expect(maybe).toBeNull();
  });
});
