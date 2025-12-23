export class DomainError extends Error {
  readonly code: string
  constructor(message?: string, code = 'DOMAIN_ERROR') {
    super(message)
    this.name = 'DomainError'
    this.code = code
  }
}

export class SizeNotNumberError extends DomainError {
  constructor(message = 'Size must be a number') {
    super(message, 'SIZE_NOT_NUMBER')
    this.name = 'SizeNotNumberError'
  }
}

export class SizeMustBePositiveError extends DomainError {
  constructor(message = 'Size must be positive') {
    super(message, 'SIZE_MUST_BE_POSITIVE')
    this.name = 'SizeMustBePositiveError'
  }
}

export class PriceNotNumberError extends DomainError {
  constructor(message = 'Price must be a number') {
    super(message, 'PRICE_NOT_NUMBER')
    this.name = 'PriceNotNumberError'
  }
}

export class PriceMustBePositiveError extends DomainError {
  constructor(message = 'Price must be positive') {
    super(message, 'PRICE_MUST_BE_POSITIVE')
    this.name = 'PriceMustBePositiveError'
  }
}

export class EntryDateInvalidError extends DomainError {
  constructor(message = 'Entry date required') {
    super(message, 'ENTRY_DATE_INVALID')
    this.name = 'EntryDateInvalidError'
  }
}

export class SymbolRequiredError extends DomainError {
  constructor(message = 'Symbol required') {
    super(message, 'SYMBOL_REQUIRED')
    this.name = 'SymbolRequiredError'
  }
}

export class SymbolTooLongError extends DomainError {
  constructor(message = 'Symbol too long') {
    super(message, 'SYMBOL_TOO_LONG')
    this.name = 'SymbolTooLongError'
  }
}

export class StatusInvalidError extends DomainError {
  constructor(message = 'Invalid status') {
    super(message, 'STATUS_INVALID')
    this.name = 'StatusInvalidError'
  }
}
