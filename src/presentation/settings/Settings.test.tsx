import { render, screen, fireEvent } from '@testing-library/react';
import { Settings } from './Settings';
import { TradeJournal } from '@/presentation/trade/TradeJournal';
import LocalStorageTradeRepository from '@/infrastructure/trade/repositories/LocalStorageTradeRepository';

// vitest.setup.js already mocks ResizeObserver; no local FakeResizeObserver needed

// Provide a minimal localStorage implementation for tests if missing
beforeAll(() => {
  if (!window.localStorage || typeof window.localStorage.getItem !== 'function') {
    const store: Record<string, string> = {};
    const mock = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = String(v);
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
      key: (i: number) => Object.keys(store)[i] || null,
      get length() {
        return Object.keys(store).length;
      },
    };
    Object.defineProperty(window, 'localStorage', { value: mock, configurable: true });
  }
});

beforeEach(() => {
  try {
    window.localStorage.removeItem('mt_user_settings_v1');
    window.localStorage.removeItem('mt_trades_v1');
  } catch {
    // ignore if localStorage not available
  }
});

describe('Settings Switch and TradeJournal debug banner', () => {
  it('toggles debug UI in localStorage and TradeJournal shows debug banner', async () => {
    render(<Settings />);
    // find the switch by role
    const switchBtn = (await screen.findByRole('switch')) as HTMLElement;
    expect(switchBtn).toBeTruthy();

    // click to enable
    fireEvent.click(switchBtn);

    // assert localStorage was updated
    const raw = window.localStorage.getItem('mt_user_settings_v1');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.debugUI).toBe(true);

    // render TradeJournal with a repo and expect debug banner visible
    render(<TradeJournal repo={new LocalStorageTradeRepository()} />);
    const banner = await screen.findByText(/trades loaded/i);
    expect(banner).toBeTruthy();
  });
});
