import { StatusInvalidError } from '@/domain/trade/errors/DomainErrors'

export type TradeStatusValue = 'OPEN' | 'PENDING' | 'FILLED' | 'CANCELLED' | 'CLOSED'

const allowed: TradeStatusValue[] = ['OPEN', 'PENDING', 'FILLED', 'CANCELLED', 'CLOSED']

export class TradeStatus {
  public readonly value: TradeStatusValue

  constructor(value: string) {
    const normalized = String(value ?? '').trim().toUpperCase() as TradeStatusValue
    if (!allowed.includes(normalized)) throw new StatusInvalidError()
    this.value = normalized
  }

  toString() {
    return this.value
  }

  equals(other: TradeStatus) {
    return this.value === other.value
  }
}

