import { SizeNotNumberError, SizeMustBePositiveError } from '@/domain/trade/errors/DomainErrors'

export class Size {
  public readonly amount: number

  constructor(amount: number) {
    if (Number.isNaN(amount)) throw new SizeNotNumberError()
    if (amount <= 0) throw new SizeMustBePositiveError()
    this.amount = Number(amount)
  }

  toNumber() {
    return this.amount
  }

  equals(other: Size) {
    return this.amount === other.amount
  }
}
