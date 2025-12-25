export class Leverage {
  public readonly value?: number

  constructor(raw?: number) {
    if (raw === undefined || raw === null) {
      this.value = undefined
      return
    }
    if (typeof raw !== 'number' || Number.isNaN(raw) || raw <= 0) {
      throw new LeverageInvalidError(raw)
    }
    this.value = raw
  }
}

export class LeverageInvalidError extends Error {
  constructor(value: unknown) {
    super(`Leverage must be a positive number: ${value}`)
    this.name = 'LeverageInvalidError'
  }
}
