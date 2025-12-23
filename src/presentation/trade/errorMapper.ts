// Maps domain error instances to presentation-friendly field errors or a general message.
// Keeps `TradeJournal.tsx` focused on UI, not error-branching logic.

import type { FormErrors } from './validation'
import { t } from '@/presentation/i18n'
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

export type MappedError = {
  fieldErrors?: FormErrors
  message?: string
}

export function mapDomainErrorToFieldErrors(err: unknown): MappedError {
  // Prefer error.code if available (stable contract), fallback to instanceof checks
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code?: unknown }).code
    if (typeof code === 'string') {
      switch (code) {
        case 'SIZE_MUST_BE_POSITIVE':
          return { fieldErrors: { size: t('sizePositive') } }
        case 'SIZE_NOT_NUMBER':
          return { fieldErrors: { size: t('sizeNumber') } }
        case 'PRICE_MUST_BE_POSITIVE':
          return { fieldErrors: { price: t('pricePositive') } }
        case 'PRICE_NOT_NUMBER':
          return { fieldErrors: { price: t('priceNumber') } }
        case 'ENTRY_DATE_INVALID':
          return { fieldErrors: { entryDate: t('invalidDate') } }
        case 'SYMBOL_REQUIRED':
          return { fieldErrors: { symbol: t('symbolRequired') } }
        case 'SYMBOL_TOO_LONG':
          return { fieldErrors: { symbol: t('symbolTooLong') } }
        default:
          break
      }
    }
  }

  // instanceof fallback (backwards compatible)
  if (err instanceof SizeMustBePositiveError) return { fieldErrors: { size: t('sizePositive') } }
  if (err instanceof SizeNotNumberError) return { fieldErrors: { size: t('sizeNumber') } }
  if (err instanceof PriceMustBePositiveError) return { fieldErrors: { price: t('pricePositive') } }
  if (err instanceof PriceNotNumberError) return { fieldErrors: { price: t('priceNumber') } }
  if (err instanceof EntryDateInvalidError) return { fieldErrors: { entryDate: t('invalidDate') } }
  if (err instanceof SymbolRequiredError) return { fieldErrors: { symbol: t('symbolRequired') } }
  if (err instanceof SymbolTooLongError) return { fieldErrors: { symbol: t('symbolTooLong') } }

  // Unknown domain error: surface a safe, i18n-ready message
  if (err instanceof DomainError) return { message: t('failedAdd') }
  return { message: t('failedAdd') }
}
