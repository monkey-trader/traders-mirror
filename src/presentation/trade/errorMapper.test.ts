import { describe, it, expect } from 'vitest'
import { mapDomainErrorToFieldErrors } from './errorMapper'
import {
  SizeNotNumberError,
  SizeMustBePositiveError,
  PriceNotNumberError,
  PriceMustBePositiveError,
  EntryDateInvalidError,
  SymbolRequiredError,
  SymbolTooLongError,
  DomainError,
} from '@/domain/trade/errors/DomainErrors'

describe('presentation/trade/errorMapper', () => {
  it('maps known domain errors to field errors', () => {
    expect(mapDomainErrorToFieldErrors(new SizeMustBePositiveError()).fieldErrors).toHaveProperty('size')
    expect(mapDomainErrorToFieldErrors(new SizeNotNumberError()).fieldErrors).toHaveProperty('size')
    expect(mapDomainErrorToFieldErrors(new PriceMustBePositiveError()).fieldErrors).toHaveProperty('price')
    expect(mapDomainErrorToFieldErrors(new PriceNotNumberError()).fieldErrors).toHaveProperty('price')
    expect(mapDomainErrorToFieldErrors(new EntryDateInvalidError()).fieldErrors).toHaveProperty('entryDate')
    expect(mapDomainErrorToFieldErrors(new SymbolRequiredError()).fieldErrors).toHaveProperty('symbol')
    expect(mapDomainErrorToFieldErrors(new SymbolTooLongError()).fieldErrors).toHaveProperty('symbol')
  })

  it('returns a general message for unknown errors', () => {
    const mapped = mapDomainErrorToFieldErrors(new Error('boom'))
    expect(mapped.fieldErrors).toBeUndefined()
    expect(mapped.message).toBeDefined()
  })

  it('maps by error.code when present', () => {
    const fake = new DomainError('fake', 'SIZE_MUST_BE_POSITIVE')
    const mapped = mapDomainErrorToFieldErrors(fake)
    expect(mapped.fieldErrors).toHaveProperty('size')
  })
})
