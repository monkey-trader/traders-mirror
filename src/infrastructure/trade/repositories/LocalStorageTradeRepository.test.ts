import { describe, it, expect, beforeEach } from 'vitest';
import LocalStorageTradeRepository, { RepoTrade } from './LocalStorageTradeRepository';
import { TradeFactory } from '@/domain/trade/entities/TradeFactory';

describe('LocalStorageTradeRepository.toRepoTrade conversions', () => {
  let repo: LocalStorageTradeRepository;

  beforeEach(() => {
    // use a test-specific key and avoid seeding defaults to keep tests deterministic
    repo = new LocalStorageTradeRepository('mt_test_key', { seedDefaults: false });
    // clear any previously stored test key
    try {
      window.localStorage.removeItem('mt_test_key');
    } catch {
      // ignore
    }
  });

  it('converts a VO-like object (fields with .value) to RepoTrade correctly', () => {
    const voLike = {
      id: 'v1',
      market: 'Crypto',
      symbol: { value: 'ETHUSD' },
      entryDate: { value: '2025-12-28T12:00:00Z' },
      size: { value: 0.51 },
      price: { value: 1800.5 },
      side: { value: 'SHORT' },
      status: 'OPEN',
      pnl: 0,
      notes: 'note',
      sl: 1815.0,
      tp1: 1790.0,
      margin: 120,
      leverage: 10,
    } as unknown;

    const converted = (repo as unknown as { toRepoTrade: (o: unknown) => RepoTrade }).toRepoTrade(voLike);

    expect(converted.id).toBe('v1');
    expect(converted.market).toBe('Crypto');
    expect(converted.symbol).toBe('ETHUSD');
    expect(converted.entryDate).toBe('2025-12-28T12:00:00Z');
    expect(converted.size).toBeCloseTo(0.51);
    expect(converted.price).toBeCloseTo(1800.5);
    expect(converted.side).toBe('SHORT');
    expect(converted.status).toBe('OPEN');
    expect(converted.sl).toBe(1815.0);
    expect(converted.tp1).toBe(1790.0);
    expect(converted.margin).toBe(120);
    expect(converted.leverage).toBe(10);
  });

  it('converts a plain primitive object to RepoTrade correctly', () => {
    const prim = {
      id: 'p1',
      market: 'Forex',
      symbol: 'EURUSD',
      entryDate: '2025-12-27T10:00:00Z',
      size: 1,
      price: 1.234,
      side: 'LONG',
      status: 'OPEN',
      pnl: 0,
    } as unknown;

    const converted = (repo as unknown as { toRepoTrade: (o: unknown) => RepoTrade }).toRepoTrade(prim);

    expect(converted.id).toBe('p1');
    expect(converted.market).toBe('Forex');
    expect(converted.symbol).toBe('EURUSD');
    expect(converted.entryDate).toBe('2025-12-27T10:00:00Z');
    expect(converted.size).toBe(1);
    expect(converted.price).toBeCloseTo(1.234);
    expect(converted.side).toBe('LONG');
  });

  it('returns fallback RepoTrade for non-object input', () => {
    const converted = (repo as unknown as { toRepoTrade: (o: unknown) => RepoTrade }).toRepoTrade('a-string');
    expect(converted.id).toBe('unknown');
    expect(converted.symbol).toBe('UNKNOWN');
    expect(converted.size).toBe(0);
    expect(converted.price).toBe(0);
  });

  it('save + getAll roundtrip persists and reconstructs domain Trades', async () => {
    const trade = TradeFactory.create({
      id: 't-save',
      symbol: 'BTCUSD',
      size: 1,
      price: 20000,
      side: 'LONG',
    });

    await repo.save(trade);
    const all = await repo.getAll();
    const found = all.find((t) => t.id === 't-save');
    expect(found).toBeDefined();
    if (found) {
      expect(found.symbol.value).toBe('BTCUSD');
      expect(found.price.value).toBe(20000);
      expect(found.size.value).toBe(1);
      expect(found.side.value).toBe('LONG');
    }
  });
});
