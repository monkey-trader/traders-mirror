export class Price {
  public readonly amount: number

  constructor(amount: number) {
    if (typeof amount !== 'number' || Number.isNaN(amount)) throw new Error('Price must be a number')
    if (amount <= 0) throw new Error('Price must be positive')
    this.amount = Number(amount)
  }

  toNumber() {
    return this.amount
  }

  equals(other: Price) {
    return this.amount === other.amount
  }
}

