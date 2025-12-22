import type { Trade } from '../entities/Trade'

export type TradeRepository = {
  save(trade: Trade): Promise<void>
  getAll(): Promise<Trade[]>
}
