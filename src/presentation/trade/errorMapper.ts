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
} from '@/domain/trade/errors/DomainErrors'

export type MappedError = {
  fieldErrors?: FormErrors
  message?: string
}

export function mapDomainErrorToFieldErrors(err: unknown): MappedError {
  if (err instanceof SizeMustBePositiveError) return { fieldErrors: { size: t('sizePositive') } }
  if (err instanceof SizeNotNumberError) return { fieldErrors: { size: t('sizeNumber') } }
  if (err instanceof PriceMustBePositiveError) return { fieldErrors: { price: t('pricePositive') } }
  if (err instanceof PriceNotNumberError) return { fieldErrors: { price: t('priceNumber') } }
  if (err instanceof EntryDateInvalidError) return { fieldErrors: { entryDate: t('invalidDate') } }
  if (err instanceof SymbolRequiredError) return { fieldErrors: { symbol: t('symbolRequired') } }
  if (err instanceof SymbolTooLongError) return { fieldErrors: { symbol: t('symbolTooLong') } }

  // Unknown domain error: surface a safe, i18n-ready message
  return { message: t('failedAdd') }
}
