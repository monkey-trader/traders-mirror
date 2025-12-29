import { describe, it, expect, beforeEach } from 'vitest';
import { TradeService } from './TradeService';
import { TradeInput } from '@/domain/trade/entities/TradeFactory';

class MockRepo {
  trades: TradeInput[] = [];
  async save(trade: any) {
    this.trades.push(trade);
  }
  async getAll() {
    return this.trades;
  }
  async update(trade: any) {
    const idx = this.trades.findIndex((t) => t.id === trade.id);
    if (idx >= 0) this.trades[idx] = trade;
  }
}

describe('TradeService', () => {
  let service: TradeService;
  let repo: MockRepo;
  beforeEach(() => {
    repo = new MockRepo();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- autofix: preserve tests that intentionally use any
    service = new TradeService(repo as any);
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
