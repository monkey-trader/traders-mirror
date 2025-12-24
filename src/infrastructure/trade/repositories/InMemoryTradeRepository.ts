import type { Trade } from '@/domain/trade/entities/Trade'
import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository'

export class InMemoryTradeRepository implements TradeRepository {
  private trades: Trade[] = []

  async save(trade: Trade) {
    // Upsert by composite key to avoid duplicates when the same trade is modified
    const key = `${trade.symbol}::${trade.entryDate}::${trade.size}::${trade.price}`
    const idx = this.trades.findIndex((t) => `${t.symbol}::${t.entryDate}::${t.size}::${t.price}` === key)
    if (idx === -1) {
      this.trades.push(trade)
    } else {
      this.trades[idx] = trade
    }
  }

  async getAll(): Promise<Trade[]> {
    return [...this.trades]
  }
}
