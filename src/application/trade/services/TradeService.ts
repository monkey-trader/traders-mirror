import { Trade } from '../../../domain/trade/entities/Trade'
import type { TradeRepository } from '../../../domain/trade/interfaces/TradeRepository'

export class TradeService {
  constructor(private repo: TradeRepository) {}

  async addTrade(symbol: string, entryDate: string, size: number, price: number, notes?: string) {
    const trade = new Trade(symbol, entryDate, Number(size), Number(price), notes)
    await this.repo.save(trade)
  }

  async listTrades(): Promise<Trade[]> {
    return this.repo.getAll()
  }
}
