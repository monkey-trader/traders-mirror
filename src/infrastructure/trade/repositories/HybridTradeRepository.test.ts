import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';
import HybridTradeRepository from './HybridTradeRepository';
import type FirebaseTradeRepository from './FirebaseTradeRepository';

const OUTBOX_KEY = 'trade_outbox_v1';

beforeEach(() => {
  localStorage.clear();
  // ensure navigator exists
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
});
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('HybridTradeRepository (basic outbox/flush)', () => {
  it('queues outbox when remote save fails and dispatches queued status', async () => {
    const remote = {
      save: vi.fn(() => Promise.reject(new Error('fail'))),
      update: vi.fn(),
      delete: vi.fn(),
      getAll: vi.fn(() => Promise.resolve([])),
    };

    const events: Array<Record<string, unknown>> = [];
    const listener = (e: Event) => {
      const detail = (e as CustomEvent).detail as Record<string, unknown> | undefined;
      if (detail) events.push(detail);
    };
    globalThis.addEventListener('repo-sync-status', listener);

    const repo = new HybridTradeRepository({
      remote: remote as unknown as FirebaseTradeRepository,
    });

    const trade = TradeFactory.create({
      id: 't-q',
      symbol: 'BTCUSD',
      size: 1,
      price: 100,
      side: 'LONG',
    });

    await repo.save(trade);

    // Outbox should have been persisted
    const raw = localStorage.getItem(OUTBOX_KEY);
    expect(raw).toBeTruthy();
    const arr = JSON.parse(raw as string);
    expect(Array.isArray(arr)).toBe(true);
    expect(arr.length).toBeGreaterThanOrEqual(1);

    // There should be at least one queued status event
    expect(events.some((d) => d && d.status === 'queued')).toBeTruthy();

    globalThis.removeEventListener('repo-sync-status', listener);
  });

  it('flushes outbox when remote succeeds on force and updates status to online', async () => {
    // prepare an outbox item (save)
    const tradeDto = { id: 't-f', symbol: 'ETHUSD', size: 1, price: 10, side: 'LONG' };
    localStorage.setItem(OUTBOX_KEY, JSON.stringify([{ op: 'save', dto: tradeDto }]));

    const remote = {
      save: vi.fn(() => Promise.resolve()),
      update: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
      getAll: vi.fn(() => Promise.resolve([])),
    };

    const events: Array<Record<string, unknown>> = [];
    const listener = (e: Event) => {
      const detail = (e as CustomEvent).detail as Record<string, unknown> | undefined;
      if (detail) events.push(detail);
    };
    globalThis.addEventListener('repo-sync-status', listener);

    new HybridTradeRepository({ remote: remote as unknown as FirebaseTradeRepository });

    // trigger flush via global force event (constructor registers handler)
    globalThis.dispatchEvent(new CustomEvent('repo-sync-force'));

    // wait a tick for async flushOutbox to run
    await new Promise((r) => setTimeout(r, 20));

    // outbox should be emptied
    const raw = localStorage.getItem(OUTBOX_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    expect(arr.length).toBe(0);

    // there should be an online status event after successful flush
    expect(
      events.some(
        (d) =>
          typeof d === 'object' && d !== null && (d as Record<string, unknown>).status === 'online'
      )
    ).toBeTruthy();

    globalThis.removeEventListener('repo-sync-status', listener);
  });
});
