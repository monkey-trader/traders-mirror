import { describe, it, expect, beforeEach } from 'vitest';
import { TradeService } from './TradeService';
import { TradeInput } from '@/domain/trade/entities/TradeFactory';
import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository';

class MockRepo {
  trades: TradeInput[] = [];
  async save(trade: unknown) {
    this.trades.push(trade as TradeInput);
  }
  async getAll() {
    return this.trades;
  }
  async update(trade: unknown) {
    const t = trade as TradeInput;
    const idx = this.trades.findIndex((x) => x.id === t.id);
    if (idx >= 0) this.trades[idx] = t;
  }
}

describe('TradeService', () => {
  let service: TradeService;
  let repo: MockRepo;
  beforeEach(() => {
    repo = new MockRepo();
    service = new TradeService(repo as unknown as TradeRepository);
  });

  it('should add and list trades', async () => {
    const input: TradeInput = {
      id: '1',
      symbol: 'AAPL',
      entryDate: '2023-01-01T00:00:00Z',
      size: 1,
      price: 100,
      side: 'LONG',
      margin: 50,
    };
    await service.addTrade(input);
    const trades = await service.listTrades();
    expect(trades.length).toBe(1);
    expect(trades[0].symbol).toBe('AAPL');
  });

  it('should update a trade', async () => {
    const input: TradeInput = {
      id: '1',
      symbol: 'AAPL',
      entryDate: '2023-01-01T00:00:00Z',
      size: 1,
      price: 100,
      side: 'LONG',
      margin: 50,
    };
    await service.addTrade(input);
    await service.updateTrade({ ...input, price: 200 });
    const trades = await service.listTrades();
    expect(trades[0].price).toBe(200);
  });
});
