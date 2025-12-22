export class DomainError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'DomainError'
  }
}

export class SizeNotNumberError extends DomainError {
  constructor(message = 'Size must be a number') {
    super(message)
    this.name = 'SizeNotNumberError'
  }
}

export class SizeMustBePositiveError extends DomainError {
  constructor(message = 'Size must be positive') {
    super(message)
    this.name = 'SizeMustBePositiveError'
  }
}

export class PriceNotNumberError extends DomainError {
  constructor(message = 'Price must be a number') {
    super(message)
    this.name = 'PriceNotNumberError'
  }
}

export class PriceMustBePositiveError extends DomainError {
  constructor(message = 'Price must be positive') {
    super(message)
    this.name = 'PriceMustBePositiveError'
  }
}

export class EntryDateInvalidError extends DomainError {
  constructor(message = 'Entry date required') {
    super(message)
    this.name = 'EntryDateInvalidError'
  }
}

export class SymbolRequiredError extends DomainError {
  constructor(message = 'Symbol required') {
    super(message)
    this.name = 'SymbolRequiredError'
  }
}

export class SymbolTooLongError extends DomainError {
  constructor(message = 'Symbol too long') {
    super(message)
    this.name = 'SymbolTooLongError'
  }
}

