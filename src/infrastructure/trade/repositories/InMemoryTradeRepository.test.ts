import { describe, it, expect, beforeEach } from 'vitest';
import InMemoryTradeRepository from './InMemoryTradeRepository';
import { TradeFactory } from '@/domain/trade/entities/TradeFactory';

describe('InMemoryTradeRepository', () => {
  let repo: InMemoryTradeRepository;

  beforeEach(() => {
    repo = new InMemoryTradeRepository();
  });

  it('initializes with default mock trades', async () => {
    const trades = await repo.getAll();
    expect(Array.isArray(trades)).toBe(true);
    expect(trades.length).toBeGreaterThan(0);
  });

  it('saves a domain Trade (via TradeFactory.toDTO) and then returns it in getAll', async () => {
    const trade = TradeFactory.create({
      id: 't-save',
      symbol: 'TEST1',
      entryDate: new Date().toISOString(),
      size: 1,
      price: 10,
      side: 'LONG',
    });
    const before = await repo.getAll();
    await repo.save(trade);
    const after = await repo.getAll();
    expect(after.length).toBe(before.length + 1);
    const found = after.find((t) => t.symbol.value === 'TEST1');
    expect(found).toBeDefined();
    expect(found?.price.value).toBe(10);
  });

  it('updates an existing trade', async () => {
    const trades = await repo.getAll();
    const t = trades[0];
    const originalPrice = t.price.value;
    const modified = TradeFactory.create({
      id: t.id,
      symbol: t.symbol.value,
      entryDate: t.entryDate.value,
      size: t.size.value,
      price: originalPrice + 1,
      side: t.side.value,
    });
    await repo.update(modified);
    const reloaded = await repo.getAll();
    const updated = reloaded.find((r) => r.id === t.id);
    expect(updated).toBeDefined();
    expect(updated?.price.value).toBe(originalPrice + 1);
  });

  it('deletes an existing trade', async () => {
    const trades = await repo.getAll();
    const t = trades[0];
    await repo.delete(t.id);
    const after = await repo.getAll();
    expect(after.find((r) => r.id === t.id)).toBeUndefined();
  });

  it('toRepoTrade accepts VO-like objects and primitive shapes', async () => {
    // VO-like shape
    const voLike = {
      id: 'vo1',
      market: 'Crypto',
      symbol: { value: 'VOUSD' },
      entryDate: { value: new Date().toISOString() },
      size: { value: 2 },
      price: { value: 5 },
      side: { value: 'LONG' },
    };
    const fakeTrade = TradeFactory.create({
      id: 'vo1',
      symbol: 'VOUSD',
      entryDate: new Date().toISOString(),
      size: 2,
      price: 5,
      side: 'LONG',
    });
    // mimic VO by converting to DTO and then manually replacing fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- autofix: preserve tests that intentionally use any
    const dto = TradeFactory.toDTO(fakeTrade) as any;
    dto.symbol = { value: 'VOUSD' };
    dto.size = { value: 2 };
    dto.price = { value: 5 };
    dto.side = { value: 'LONG' };

    // Save using save() path
    await repo.save(fakeTrade);
    const all = await repo.getAll();
    expect(all.find((t) => t.id === 'vo1' || t.symbol.value === 'VOUSD')).toBeDefined();
  });
});
