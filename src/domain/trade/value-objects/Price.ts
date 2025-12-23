import { PriceNotNumberError, PriceMustBePositiveError } from '@/domain/trade/errors/DomainErrors'

export class Price {
  public readonly amount: number

  constructor(amount: number) {
    if (Number.isNaN(amount)) throw new PriceNotNumberError()
    if (amount <= 0) throw new PriceMustBePositiveError()
    this.amount = Number(amount)
  }

  toNumber() {
    return this.amount
  }

  equals(other: Price) {
    return this.amount === other.amount
  }
}
