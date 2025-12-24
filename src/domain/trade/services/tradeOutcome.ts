import type { Trade } from '@/domain/trade/entities/Trade'
import type { TradeTargetDTO } from '@/domain/trade/value-objects/TradeTarget'

export type TradeOutcome = 'WIN' | 'LOSS' | 'BREAKEVEN' | 'PENDING'

export type ComputeOptions = {
  epsilon?: number
  treatBreakEvenAsWin?: boolean
}

export type OutcomeResult = {
  outcome: TradeOutcome
  realizedPL: number
  realizedSize: number
  remainingSize: number
}

export function computeTradeOutcome(trade: Trade, opts?: ComputeOptions): OutcomeResult {
  const epsilon = opts?.epsilon ?? 0.0001
  const treatBE = opts?.treatBreakEvenAsWin ?? true

  const side = trade.side ?? 'LONG'
  const entry = Number(trade.price)
  const totalSize = Number(trade.size)

  const targets: TradeTargetDTO[] = trade.targets ?? []

  let realizedPL = 0
  let realizedSize = 0

  for (const t of targets) {
    if (t.status === 'TRIGGERED' && t.executedPrice !== undefined) {
      const execSize = t.size ?? 0
      if (execSize <= 0) continue
      const execPrice = Number(t.executedPrice)
      // LONG: (exec - entry) * size; SHORT: (entry - exec) * size
      const legPL = side === 'LONG' ? (execPrice - entry) * execSize : (entry - execPrice) * execSize
      realizedPL += legPL
      realizedSize += execSize
    }
  }

  const remainingSize = Math.max(0, totalSize - realizedSize)

  // if any BE target exists and treatBE=true and no realized positive PL, we can treat as WIN
  const hasBE = targets.some((t) => t.kind === 'BREAK_EVEN')

  // Determine outcome: final only when remainingSize == 0, otherwise PENDING unless BE snapshot rule
  if (remainingSize === 0) {
    if (realizedPL > epsilon) return { outcome: 'WIN', realizedPL, realizedSize, remainingSize }
    if (realizedPL < -epsilon) return { outcome: 'LOSS', realizedPL, realizedSize, remainingSize }
    return { outcome: 'BREAKEVEN', realizedPL, realizedSize, remainingSize }
  }

  // trade not closed
  if (treatBE && hasBE) {
    return { outcome: 'WIN', realizedPL, realizedSize, remainingSize }
  }

  return { outcome: 'PENDING', realizedPL, realizedSize, remainingSize }
}

