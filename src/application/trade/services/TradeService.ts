import { TradeFactory, TradeInput } from '@/domain/trade/entities/TradeFactory';
import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository';

export class TradeService {
  constructor(private repo: TradeRepository) {}

  async addTrade(input: TradeInput) {
    const trade = TradeFactory.create(input);
    await this.repo.save(trade);
  }

  async listTrades(): Promise<TradeInput[]> {
    const trades = await this.repo.getAll();
    return trades.map(TradeFactory.toDTO);
  }

  async updateTrade(input: TradeInput) {
    const trade = TradeFactory.create(input);
    await this.repo.update(trade);
  }
}
