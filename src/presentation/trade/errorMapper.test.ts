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
})

