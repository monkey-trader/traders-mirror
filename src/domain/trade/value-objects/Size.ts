export class Size {
  public readonly amount: number

  constructor(amount: number) {
    if (typeof amount !== 'number' || Number.isNaN(amount)) throw new Error('Size must be a number')
    if (amount <= 0) throw new Error('Size must be positive')
    this.amount = Number(amount)
  }

  toNumber() {
    return this.amount
  }

  equals(other: Size) {
    return this.amount === other.amount
  }
}

