import type { Trade } from '@/domain/trade/entities/Trade'
import type { TradeTargetDTO } from '@/domain/trade/value-objects/TradeTarget'

export type TargetingPolicy = {
  moveStopToBreakEvenMultiplier?: number
  breakEvenEpsilon?: number
}

export type BreakEvenCandidate = {
  canMoveToBreakEven: boolean
  beThreshold?: number
  stopTarget?: TradeTargetDTO
}

export type DomainEvent = {
  type: string
  payload: any
}

export class TradeTargetingService {
  static assessBreakEvenCandidate(trade: Trade, marketPrice: number, policy?: TargetingPolicy): BreakEvenCandidate {
    const multiplier = policy?.moveStopToBreakEvenMultiplier ?? 2
    const epsilon = policy?.breakEvenEpsilon ?? 1e-8

    const entry = Number(trade.price)
    const targets: TradeTargetDTO[] = trade.targets ?? []

    // find active stop loss target (status OPEN)
    const stop = targets.find((t) => t.kind === 'STOP_LOSS')
    if (!stop) return { canMoveToBreakEven: false }

    const stopPrice = Number(stop.price)
    // distance from entry to stop (positive for LONG)
    const side = trade.side ?? 'LONG'

    let threshold: number
    if (side === 'LONG') {
      const dist = entry - stopPrice
      threshold = entry + multiplier * dist
      // can move if marketPrice >= threshold - epsilon
      return { canMoveToBreakEven: marketPrice >= threshold - epsilon, beThreshold: threshold, stopTarget: stop }
    } else {
      const dist = stopPrice - entry
      threshold = entry - multiplier * dist
      return { canMoveToBreakEven: marketPrice <= threshold + epsilon, beThreshold: threshold, stopTarget: stop }
    }
  }

  static applyMoveStopToBreakEven(trade: Trade, stopTargetId?: string): DomainEvent | null {
    const targets: TradeTargetDTO[] = trade.targets ?? []
    const stopIndex = stopTargetId ? targets.findIndex((t) => t.id === stopTargetId) : targets.findIndex((t) => t.kind === 'STOP_LOSS')
    if (stopIndex === -1) return null

    const stop = targets[stopIndex]
    const entry = Number(trade.price)

    // If already break-even or price already equals entry, noop
    if (stop.kind === 'BREAK_EVEN' && Number(stop.price) === entry) return null

    const oldPrice = stop.price
    // mutate in-place: set price to entry and kind to BREAK_EVEN
    targets[stopIndex] = { ...stop, kind: 'BREAK_EVEN', price: entry }
    trade.targets = [...targets]

    const event: DomainEvent = { type: 'BreakEvenMoved', payload: { oldPrice, newPrice: entry, stopTargetId: stop.id } }
    return event
  }
}

