import { describe, it, expect, beforeEach } from 'vitest';
import LocalStorageTradeRepository, { RepoTrade } from './LocalStorageTradeRepository';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';

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

    const converted = (repo as unknown as { toRepoTrade: (o: unknown) => RepoTrade }).toRepoTrade(
      voLike
    );

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

    const converted = (repo as unknown as { toRepoTrade: (o: unknown) => RepoTrade }).toRepoTrade(
      prim
    );

    expect(converted.id).toBe('p1');
    expect(converted.market).toBe('Forex');
    expect(converted.symbol).toBe('EURUSD');
    expect(converted.entryDate).toBe('2025-12-27T10:00:00Z');
    expect(converted.size).toBe(1);
    expect(converted.price).toBeCloseTo(1.234);
    expect(converted.side).toBe('LONG');
  });

  it('returns fallback RepoTrade for non-object input', () => {
    const converted = (repo as unknown as { toRepoTrade: (o: unknown) => RepoTrade }).toRepoTrade(
      'a-string'
    );
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

  it('constructor loads existing raw data from localStorage when present', () => {
    const raw: RepoTrade[] = [
      {
        id: 'loaded-1',
        market: 'All',
        symbol: 'LOAD1',
        entryDate: '2025-12-20T00:00:00Z',
        size: 2,
        price: 100,
        side: 'LONG',
        status: 'OPEN',
        pnl: 0,
      },
    ];
    window.localStorage.setItem('mt_test_key', JSON.stringify(raw));
    const repo2 = new LocalStorageTradeRepository('mt_test_key', { seedDefaults: true });
    return repo2.getAll().then((all) => {
      expect(all.length).toBe(1);
      expect(all[0].id).toBe('loaded-1');
    });
  });

  it('constructor handles invalid JSON in localStorage and falls back to defaults or empty based on seedDefaults', async () => {
    window.localStorage.setItem('mt_test_key', 'not-a-json');

    const repoWithNoSeed = new LocalStorageTradeRepository('mt_test_key', { seedDefaults: false });
    const none = await repoWithNoSeed.getAll();
    expect(none.length).toBe(0);

    const repoWithSeed = new LocalStorageTradeRepository('mt_test_key', { seedDefaults: true });
    const some = await repoWithSeed.getAll();
    // default mock trades include t1
    expect(some.length).toBeGreaterThan(0);
    expect(some[0].id).toBe('t1');
  });

  it('seed([]) is a no-op and seed(trades) prepends and persists', async () => {
    const repo2 = new LocalStorageTradeRepository('mt_test_key', { seedDefaults: false });
    // ensure empty initially
    expect(await repo2.getAll()).toHaveLength(0);

    // seed empty -> still empty
    repo2.seed([]);
    expect(window.localStorage.getItem('mt_test_key')).toBeNull();

    // seed with one trade
    const r: RepoTrade = {
      id: 's1',
      market: 'Crypto',
      symbol: 'S1',
      entryDate: '2025-12-01T00:00:00Z',
      size: 0.1,
      price: 10,
      side: 'LONG',
      status: 'OPEN',
      pnl: 0,
    };
    repo2.seed([r]);
    const all = await repo2.getAll();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe('s1');
  });

  it('update replaces an existing trade and save path is used when not found', async () => {
    const repo2 = new LocalStorageTradeRepository('mt_test_key', { seedDefaults: false });
    // save initial trade
    const trade = TradeFactory.create({
      id: 'u1',
      symbol: 'UP1',
      size: 1,
      price: 100,
      side: 'LONG',
    });
    await repo2.save(trade);

    // modify and update
    const updated = TradeFactory.create({
      id: 'u1',
      symbol: 'UPD',
      size: 2,
      price: 200,
      side: 'LONG',
    });
    await repo2.update(updated);
    const all = await repo2.getAll();
    const found = all.find((t) => t.id === 'u1');
    expect(found).toBeDefined();
    if (found) {
      expect(found.symbol.value).toBe('UPD');
      expect(found.size.value).toBe(2);
      expect(found.price.value).toBe(200);
    }

    // update non-existing should save
    const notFound = TradeFactory.create({
      id: 'u2',
      symbol: 'NF',
      size: 1,
      price: 50,
      side: 'SHORT',
    });
    await repo2.update(notFound);
    const all2 = await repo2.getAll();
    expect(all2.find((t) => t.id === 'u2')).toBeDefined();
  });

  it('delete removes a trade by id', async () => {
    const repo2 = new LocalStorageTradeRepository('mt_test_key', { seedDefaults: false });
    const trade = TradeFactory.create({ id: 'd1', symbol: 'DEL', size: 1, price: 1, side: 'LONG' });
    await repo2.save(trade);
    expect((await repo2.getAll()).find((t) => t.id === 'd1')).toBeDefined();
    await repo2.delete('d1');
    expect((await repo2.getAll()).find((t) => t.id === 'd1')).toBeUndefined();
  });

  it('getAll recovers from TradeFactory.create errors for optional fields (e.g. invalid sl) and returns a Trade', async () => {
    const repo2 = new LocalStorageTradeRepository('mt_test_key', { seedDefaults: false });
    const bad: RepoTrade = {
      id: 'bad1',
      market: 'Forex',
      symbol: 'BAD',
      entryDate: '2025-12-02T00:00:00Z',
      size: 1,
      price: 100,
      side: 'LONG',
      status: 'OPEN',
      pnl: 0,
      sl: -10, // negative stop will cause Price constructor to throw in the full create path
    };
    // directly seed backend storage so that the constructor/getAll path processes it
    repo2.seed([bad]);
    const all = await repo2.getAll();
    const found = all.find((t) => t.id === 'bad1');
    expect(found).toBeDefined();
    if (found) {
      expect(found.id).toBe('bad1');
      // ensure returned Trade has basic fields and valid VOs
      expect(found.size.value).toBe(1);
    }
  });

  it('flush handles localStorage.setItem throwing (no crash on save/seed)', async () => {
    const repo2 = new LocalStorageTradeRepository('mt_test_key', { seedDefaults: false });
    const originalSetItem = window.localStorage.setItem;
    try {
      window.localStorage.setItem = (() => {
        throw new Error('quota');
      }) as typeof window.localStorage.setItem;

      const t = TradeFactory.create({ id: 'q1', symbol: 'Q', size: 1, price: 1, side: 'LONG' });
      // save should not throw even if setItem throws
      await expect(repo2.save(t)).resolves.toBeUndefined();

      // seed should not throw
      const r: RepoTrade = {
        id: 'q2',
        market: 'All',
        symbol: 'Q2',
        entryDate: '2025-12-01T00:00:00Z',
        size: 1,
        price: 1,
        side: 'LONG',
        status: 'OPEN',
        pnl: 0,
      };
      expect(() => repo2.seed([r])).not.toThrow();
    } finally {
      window.localStorage.setItem = originalSetItem;
    }
  });

  it('constructor without key populates defaults when seedDefaults=true', async () => {
    // ensure no key present
    window.localStorage.removeItem('mt_test_key_defaults');
    const repo3 = new LocalStorageTradeRepository('mt_test_key_defaults', { seedDefaults: true });
    // defaults flushed to localStorage
    const raw = window.localStorage.getItem('mt_test_key_defaults');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string) as RepoTrade[];
    expect(parsed.length).toBeGreaterThan(0);
    const all = await repo3.getAll();
    expect(all.length).toBeGreaterThan(0);
    expect(all[0].id).toBe('t1');
  });

  it('toRepoTrade handles VO-like with missing entryDate (falls back to now) and primitive side', () => {
    const voLikePartial = {
      id: 'vp1',
      market: 'All',
      symbol: { value: 'VP' },
      // entryDate omitted to trigger fallback
      size: { value: 1 },
      price: { value: 10 },
      side: 'LONG', // primitive side should be accepted
      status: 'OPEN',
      pnl: 0,
    } as unknown;

    const converted = (repo as unknown as { toRepoTrade: (o: unknown) => RepoTrade }).toRepoTrade(
      voLikePartial
    );
    expect(converted.id).toBe('vp1');
    expect(converted.symbol).toBe('VP');
    // entryDate fallback should be a valid ISO string
    expect(typeof converted.entryDate).toBe('string');
    expect(isNaN(Date.parse(converted.entryDate))).toBe(false);
    expect(converted.side).toBe('LONG');
  });

  it('delete is a no-op when id not found (does not throw)', async () => {
    const repo4 = new LocalStorageTradeRepository('mt_test_key', { seedDefaults: false });
    // ensure empty
    expect(await repo4.getAll()).toHaveLength(0);
    await expect(repo4.delete('non-existent-id')).resolves.toBeUndefined();
  });

  it('toRepoTrade VO-like with primitive entryDate and primitive size/price inside VO-like object', () => {
    const voLike2 = {
      id: 'v2',
      market: 'All',
      symbol: { value: 'S2' },
      entryDate: '2025-12-30T00:00:00Z', // primitive string instead of { value }
      size: 3, // primitive number even though symbol is VO-like
      price: 33,
      side: { value: 'LONG' },
      status: 'CLOSED',
      pnl: 10,
    } as unknown;

    const converted = (repo as unknown as { toRepoTrade: (o: unknown) => RepoTrade }).toRepoTrade(
      voLike2
    );
    expect(converted.id).toBe('v2');
    expect(converted.entryDate).toBe('2025-12-30T00:00:00Z');
    expect(converted.size).toBe(3);
    expect(converted.price).toBe(33);
    expect(converted.status).toBe('CLOSED');
  });

  it('toRepoTrade primitive object missing side/status/market/pnl falls back to defaults', () => {
    const prim2 = {
      id: 'p2',
      symbol: 'XYZ',
      entryDate: '2025-11-11T11:11:00Z',
      size: 1,
      price: 1.11,
      // side/status omitted
    } as unknown;

    const converted = (repo as unknown as { toRepoTrade: (o: unknown) => RepoTrade }).toRepoTrade(
      prim2
    );
    expect(converted.id).toBe('p2');
    expect(converted.side).toBe('LONG'); // default
    expect(converted.status).toBe('OPEN');
    expect(converted.market).toBe('All');
    expect(converted.pnl).toBe(0);
  });

  it('toRepoTrade handles null and undefined as non-object fallback', () => {
    const convertedNull = (
      repo as unknown as { toRepoTrade: (o: unknown) => RepoTrade }
    ).toRepoTrade(null);
    expect(convertedNull.id).toBe('unknown');
    const convertedUndef = (
      repo as unknown as { toRepoTrade: (o: unknown) => RepoTrade }
    ).toRepoTrade(undefined);
    expect(convertedUndef.id).toBe('unknown');
  });

  it('isObject and looksLikeVOTrade helper branches', () => {
    const helper = repo as unknown as {
      isObject: (v: unknown) => boolean;
      looksLikeVOTrade: (v: unknown) => boolean;
      toRepoTrade: (v: unknown) => RepoTrade;
    };

    // isObject
    expect(helper.isObject({})).toBe(true);
    expect(helper.isObject(null)).toBe(false);
    expect(helper.isObject('str')).toBe(false);

    // looksLikeVOTrade variants
    expect(helper.looksLikeVOTrade({})).toBe(false); // no symbol
    expect(helper.looksLikeVOTrade({ symbol: 'X' })).toBe(false); // symbol not object
    expect(helper.looksLikeVOTrade({ symbol: {} })).toBe(false); // symbol object but no value
    expect(helper.looksLikeVOTrade({ symbol: { value: 'X' } })).toBe(true); // valid VO

    // toRepoTrade: object where symbol is object without value should fall back to primitive branch (String(o.symbol))
    const weird = {
      id: 'weird',
      symbol: {},
      entryDate: '2025-01-01T00:00:00Z',
      size: 1,
      price: 1,
      side: 'LONG',
    } as unknown;
    const convertedWeird = helper.toRepoTrade(weird);
    expect(convertedWeird.symbol).toBe(String((weird as Record<string, unknown>).symbol));

    // seed non-array is no-op
    (repo as unknown as LocalStorageTradeRepository).seed(null as unknown as RepoTrade[]);
    expect(window.localStorage.getItem('mt_test_key')).toBeNull();
  });

  it('toRepoTrade VO-like edge cases where nested objects lack value keys', () => {
    const voEdge = {
      id: 'edge1',
      market: undefined,
      symbol: { value: 'EDGE' },
      entryDate: {}, // object without 'value'
      size: { foo: 1 }, // object without 'value' -> else branch
      price: { bar: 2 }, // object without 'value' -> else branch
      side: { foo: 'UNKNOWN' }, // object without 'value' -> else branch
      // status omitted -> default
      // pnl omitted -> default 0
    } as unknown;

    const converted = (repo as unknown as { toRepoTrade: (o: unknown) => RepoTrade }).toRepoTrade(
      voEdge
    );
    expect(converted.id).toBe('edge1');
    expect(converted.symbol).toBe('EDGE');
    // entryDate becomes String(entryDateVO) -> "[object Object]"
    expect(converted.entryDate).toBe(String((voEdge as Record<string, unknown>).entryDate));
    // size/price fallback to Number(o.size as number) which will be NaN for objects
    expect(Number.isNaN(converted.size)).toBe(true);
    expect(Number.isNaN(converted.price)).toBe(true);
    // side will be the raw object cast; ensure it's not 'LONG' or 'SHORT'
    expect(converted.side === 'LONG' || converted.side === 'SHORT').toBe(false);
    expect(converted.status).toBe('OPEN');
    expect(converted.market).toBe('All');
    expect(converted.pnl).toBe(0);
  });
});
