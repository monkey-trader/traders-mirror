import type { Trade } from '../../../domain/trade/entities/Trade'
import type { TradeRepository } from '../../../domain/trade/interfaces/TradeRepository'
import { TradeFactory } from '../../../domain/trade/factories/TradeFactory'

export class TradeService {
  constructor(private repo: TradeRepository) {}

  async addTrade(symbol: string, entryDate: string, size: number, price: number, notes?: string, status?: string) {
    const trade = TradeFactory.create({ symbol, entryDate, size, price, notes, status })
    await this.repo.save(trade)
  }

  async listTrades(): Promise<Trade[]> {
    return this.repo.getAll()
  }
}
