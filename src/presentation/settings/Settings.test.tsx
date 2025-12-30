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
    // wait for TradeJournal heading to ensure mount completed
    await screen.findByRole('heading', { name: /Trading Journal/i });
    const banner = await screen.findByText(/trades loaded/i);
    expect(banner).toBeTruthy();
  });

  it('toggles showLoadMockButton and persists to localStorage', async () => {
    // ensure clean settings
    window.localStorage.removeItem('mt_user_settings_v1');
    render(<Settings />);
    // wait for settings to mount
    await screen.findByRole('heading', { name: /Settings/i });

    const toggle = await screen.findByLabelText('Toggle show load mock button');
    expect(toggle).toBeTruthy();

    // initial value is Visible (default true) -> clicking sets to Hidden and persists
    fireEvent.click(toggle);

    const raw = window.localStorage.getItem('mt_user_settings_v1');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.showLoadMockButton).toBe(false);
  });

  it('clear stored trades shows info banner', async () => {
    // seed some stored trades
    window.localStorage.setItem('mt_trades_v1', JSON.stringify([{ id: 'a' }, { id: 'b' }]));
    render(<Settings />);
    await screen.findByRole('heading', { name: /Settings/i });

    // click Delete demo data button and confirm
    const delBtn = screen.getByRole('button', { name: /Delete demo data/i });
    fireEvent.click(delBtn);
    // wait for the confirm dialog message to appear, then click the confirm button
    await screen.findByText(/Alle gespeicherten Trades entfernen\?/i);
    const confirm = await screen.findByRole('button', { name: /Löschen/i });
    fireEvent.click(confirm);

    // info banner should appear with deleted count
    const status = await screen.findByRole('status');
    expect(status.textContent).toMatch(/Deleted 2 stored trade/);
    // Note: reload trigger is not tested here due to happy-dom limitations with timers
  });

  it('restores demo data and persists to localStorage', async () => {
    // clear existing trades
    window.localStorage.removeItem('mt_trades_v1');
    render(<Settings />);
    await screen.findByRole('heading', { name: /Settings/i });

    // click Add demo data and confirm
    const addBtn = screen.getByRole('button', { name: /Add demo data/i });
    fireEvent.click(addBtn);
    // wait for confirm dialog and click restore
    await screen.findByText(/Demo-Daten wiederherstellen\?/i);
    const confirmBtn = await screen.findByRole('button', { name: /Wiederherstellen/i });
    fireEvent.click(confirmBtn);

    // ensure data persisted
    const raw = window.localStorage.getItem('mt_trades_v1');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
    // Note: reload trigger is not tested here due to happy-dom limitations with timers
  });
});

describe('Settings edge cases', () => {
  it('handles corrupted mt_trades_v1 gracefully when clearing', async () => {
    window.localStorage.setItem('mt_trades_v1', 'not-an-array');
    render(<Settings />);
    await screen.findByRole('heading', { name: /Settings/i });
    const delBtn = screen.getByRole('button', { name: /Delete demo data/i });
    fireEvent.click(delBtn);
    await screen.findByText(/Alle gespeicherten Trades entfernen\?/i);
    const confirm = await screen.findByRole('button', { name: /Löschen/i });
    fireEvent.click(confirm);
    const status = await screen.findByRole('status');
    expect(status.textContent).toMatch(/Deleted 0 stored trade/);
  });

  it('cleans up timers on unmount', async () => {
    const { unmount } = render(<Settings />);
    await screen.findByRole('heading', { name: /Settings/i });
    // Simulate info message and timer
    const storageBtn = screen.getByRole('button', { name: /Add demo data/i });
    fireEvent.click(storageBtn);
    await screen.findByText(/Demo-Daten wiederherstellen\?/i);
    const confirmBtn = await screen.findByRole('button', { name: /Wiederherstellen/i });
    fireEvent.click(confirmBtn);
    // Unmount before timer fires
    unmount();
    // No error should be thrown
  });
});
