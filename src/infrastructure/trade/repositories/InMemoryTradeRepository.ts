import { Trade } from '@/domain/trade/entities/Trade'
import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository'

export class InMemoryTradeRepository implements TradeRepository {
  private trades: Trade[] = []

  async save(trade: Trade) {
    this.trades.push(trade)
  }

  async getAll(): Promise<Trade[]> {
    return [...this.trades]
  }

  async update(trade: Trade) {
    const idx = this.trades.findIndex(t => t.id === trade.id)
    if (idx >= 0) this.trades[idx] = trade
  }
}

