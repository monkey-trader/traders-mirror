export class EntryDate {
  public readonly value: string
  constructor(date: string) {
    if (!date || isNaN(Date.parse(date))) throw new EntryDateInvalidError(date)
    this.value = new Date(date).toISOString()
  }
}

export class EntryDateInvalidError extends Error {
  constructor(date: unknown) {
    super(`Entry date invalid: ${date}`)
    this.name = 'EntryDateInvalidError'
  }
}

