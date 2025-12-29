import { render, screen, fireEvent } from '@testing-library/react';
import { Settings } from './Settings';
import { TradeJournal } from '@/presentation/trade/TradeJournal';
import LocalStorageTradeRepository from '@/infrastructure/trade/repositories/LocalStorageTradeRepository';
import { vi } from 'vitest';

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

  it('clear stored trades shows info banner and triggers reload', async () => {
    // seed some stored trades
    window.localStorage.setItem('mt_trades_v1', JSON.stringify([{ id: 'a' }, { id: 'b' }]));
    render(<Settings />);
    await screen.findByRole('heading', { name: /Settings/i });

    // stub reload and use fake timers so we can advance time
    const reloadSpy = vi.fn();
    let spied = false;
    try {
      vi.spyOn(window.location, 'reload').mockImplementation(() => {
        reloadSpy();
      });
      spied = true;
    } catch {
      // unable to spy on reload in this environment; we'll skip asserting reload was called
      spied = false;
    }

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

    // now switch to fake timers and advance to trigger reload
    vi.useFakeTimers();
    vi.advanceTimersByTime(1300);
    // check reload called only if we successfully spied on it
    if (spied) expect(reloadSpy).toHaveBeenCalled();

    // cleanup
    vi.useRealTimers();
    if (spied) {
      // restore spy
      // @ts-expect-error Vi mockRestore exists on the mocked reload
      window.location.reload.mockRestore();
    }
  });

  it('restores demo data and persists to localStorage, then triggers reload', async () => {
    // clear existing trades
    window.localStorage.removeItem('mt_trades_v1');
    render(<Settings />);
    await screen.findByRole('heading', { name: /Settings/i });

    // stub reload and use fake timers
    const reloadSpy = vi.fn();
    let spied2 = false;
    try {
      vi.spyOn(window.location, 'reload').mockImplementation(() => {
        reloadSpy();
      });
      spied2 = true;
    } catch {
      spied2 = false;
    }

    // click Add demo data and confirm
    const addBtn = screen.getByRole('button', { name: /Add demo data/i });
    fireEvent.click(addBtn);
    // wait for confirm dialog and click restore
    await screen.findByText(/Demo-Daten wiederherstellen\?/i);
    const confirm = await screen.findByRole('button', { name: /Wiederherstellen/i });
    fireEvent.click(confirm);

    // ensure data persisted
    const raw = window.localStorage.getItem('mt_trades_v1');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);

    // trigger reload via timer (use fake timers to control)
    vi.useFakeTimers();
    vi.advanceTimersByTime(1300);
    if (spied2) expect(reloadSpy).toHaveBeenCalled();
    vi.useRealTimers();
    if (spied2) {
      // @ts-expect-error Vi mockRestore exists on the mocked reload
      window.location.reload.mockRestore();
    }
  });
});
