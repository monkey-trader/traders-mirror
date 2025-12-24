import type { Trade } from '@/domain/trade/entities/Trade'
import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository'
import { TradeTargetingService, DomainEvent, BreakEvenCandidate, TargetingPolicy } from '@/domain/trade/services/TradeTargetingService'

export class TradeEvaluationService {
  constructor(private repo: TradeRepository, private policy?: TargetingPolicy) {}

  async onMarketTick(symbol: string, marketPrice: number): Promise<Array<{ trade: Trade; candidate: BreakEvenCandidate }>> {
    const all = await this.repo.getAll()
    const trades = all.filter((t) => t.symbol === symbol)
    const results: Array<{ trade: Trade; candidate: BreakEvenCandidate }> = []
    for (const trade of trades) {
      const candidate = TradeTargetingService.assessBreakEvenCandidate(trade, marketPrice, this.policy)
      if (candidate.canMoveToBreakEven) results.push({ trade, candidate })
    }
    return results
  }

  async moveStopToBreakEven(trade: Trade, stopTargetId?: string): Promise<DomainEvent | null> {
    const ev = TradeTargetingService.applyMoveStopToBreakEven(trade, stopTargetId)
    if (ev) {
      await this.repo.save(trade)
    }
    return ev
  }
}

