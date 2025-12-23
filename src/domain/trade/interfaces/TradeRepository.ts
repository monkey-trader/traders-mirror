import type { Trade } from '@/domain/trade/entities/Trade'

export type TradeRepository = {
  save(trade: Trade): Promise<void>
  getAll(): Promise<Trade[]>
}
