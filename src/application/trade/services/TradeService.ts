import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository';
import type { Trade } from '@/domain/trade/entities/Trade';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';
import type { TradeInput } from '@/domain/trade/factories/TradeFactory';

export class TradeService {
  constructor(private repo: TradeRepository) {}

  // High-level API used by Presentation/Application tests and components
  async addTrade(input: TradeInput): Promise<void> {
    const trade = TradeFactory.create(input);
    return await this.save(trade);
  }

  async updateTrade(input: TradeInput): Promise<void> {
    const trade = TradeFactory.create(input);
    return await this.update(trade);
  }

  async listTrades(): Promise<TradeInput[]> {
    const trades = await this.getAll();
    return trades.map((t) => TradeFactory.toDTO(t));
  }

  // ...existing low-level methods kept for adapters/backwards compatibility
  async save(trade: Trade): Promise<void> {
    if (typeof this.repo.save === 'function') return await this.repo.save(trade);
    // fallback to update if save not present
    if (typeof this.repo.update === 'function') return await this.repo.update(trade);
    throw new Error('Repository does not implement save or update');
  }

  async update(trade: Trade): Promise<void> {
    if (typeof this.repo.update === 'function') return await this.repo.update(trade);
    if (typeof this.repo.save === 'function') return await this.repo.save(trade);
    throw new Error('Repository does not implement update or save');
  }

  async delete(id: string): Promise<void> {
    if (typeof this.repo.delete === 'function') return await this.repo.delete(id);
    throw new Error('Repository does not implement delete');
  }

  async getAll() {
    if (typeof this.repo.getAll === 'function') return await this.repo.getAll();
    return [] as Trade[];
  }
}
