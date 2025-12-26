import type { MarketValue } from '@/presentation/shared/components/MarketSelect/MarketSelect'
import type { TradeInput } from '@/domain/trade/entities/TradeFactory'

export type TradeForm = {
  symbol: string
  entryDate: string
  size?: number
  price?: number
  side: string
  market?: MarketValue
  sl?: number
  margin?: number
  leverage?: number
}

export type ValidationResult = { field?: string; message: string } | null

export function validateNewTrade(input: TradeForm): ValidationResult[] {
  const errors: ValidationResult[] = []
  if (!input.symbol || input.symbol.trim().length === 0) {
    errors.push({ field: 'symbol', message: 'Symbol ist erforderlich' })
  }
  if (!input.entryDate || input.entryDate.trim().length === 0) {
    errors.push({ field: 'entryDate', message: 'Entry Date ist erforderlich' })
  } else if (isNaN(Date.parse(input.entryDate))) {
    errors.push({ field: 'entryDate', message: 'Entry Date ist ungültig' })
  }

  // price: missing vs invalid
  if (typeof input.price !== 'number' || Number.isNaN(input.price)) {
    errors.push({ field: 'price', message: 'Entry Price ist erforderlich' })
  } else if (input.price <= 0) {
    errors.push({ field: 'price', message: 'Preis muss eine positive Zahl sein' })
  }

  // size must be provided and a positive number
  if (typeof input.size !== 'number' || Number.isNaN(input.size) || input.size <= 0) {
    errors.push({ field: 'size', message: 'Größe muss positiv sein' })
  }

  if (!input.side || (input.side !== 'LONG' && input.side !== 'SHORT')) {
    errors.push({ field: 'side', message: 'Seite muss LONG oder SHORT sein' })
  }
  if (!input.market || (input.market !== 'Forex' && input.market !== 'Crypto')) {
    errors.push({ field: 'market', message: 'Bitte Markt auswählen' })
  }
  // New required fields: SL, Margin, Leverage (now typed as numbers)
  if (typeof input.sl !== 'number' || Number.isNaN(input.sl)) {
    errors.push({ field: 'sl', message: 'Stop Loss (SL) ist erforderlich' })
  }

  if (typeof input.margin !== 'number' || Number.isNaN(input.margin) || input.margin <= 0) {
    errors.push({ field: 'margin', message: 'Margin ist erforderlich' })
  }

  if (typeof input.leverage !== 'number' || Number.isNaN(input.leverage) || input.leverage <= 0) {
    errors.push({ field: 'leverage', message: 'Leverage ist erforderlich' })
  }

  return errors
}

// This function is used by the TradeDetailEditor; it returns a mapping of field -> message (or undefined)
export function validateTrade(input: TradeInput): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}
  // narrow to a record so we can safely access optional fields that may not be in the TradeInput type
  const maybe = input as unknown as Record<string, unknown>

  if (!input.symbol || String(input.symbol).trim().length === 0) {
    out.symbol = 'Symbol ist erforderlich'
  }
  if (!input.entryDate || String(input.entryDate).trim().length === 0) {
    out.entryDate = 'Entry Date ist erforderlich'
  } else if (isNaN(Date.parse(String(input.entryDate)))) {
    out.entryDate = 'Entry Date ist ungültig'
  }

  // price/size: accept numbers or convertible values, validate as numbers
  if (typeof maybe.price === 'undefined' || maybe.price === null || String(maybe.price).trim() === '') {
    out.price = 'Entry Price ist erforderlich'
  } else {
    const priceValue = Number(maybe.price as unknown)
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      out.price = 'Preis muss eine positive Zahl sein'
    }
  }

  const sizeValue = Number(maybe.size as unknown)
  if (Number.isNaN(sizeValue) || sizeValue <= 0) {
    out.size = 'Größe muss positiv sein'
  }

  if (!input.side || (input.side !== 'LONG' && input.side !== 'SHORT')) {
    out.side = 'Seite muss LONG oder SHORT sein'
  }
  // For detail editor we accept market optional, but if present validate
  if (typeof maybe.market !== 'undefined' && maybe.market !== null) {
    const m = String(maybe.market)
    if (m !== 'Forex' && m !== 'Crypto' && m !== 'All' && m !== '') {
      out.market = 'Ungültiger Markt'
    }
  }

  // Require SL, margin, leverage in detail editor as numbers. Use typeof checks on maybe object.
  // Only validate sl/margin/leverage if the field is present on the input object.
  // The detail editor does not render margin/leverage, so they should not block saving.
  if ('sl' in maybe) {
    const slv = maybe.sl as number
    if (typeof slv !== 'number' || Number.isNaN(slv)) {
      out.sl = 'Stop Loss (SL) ist erforderlich'
    }
  }

  if ('margin' in maybe) {
    const mval = maybe.margin as number
    if (typeof mval !== 'number' || Number.isNaN(mval) || mval <= 0) {
      out.margin = 'Margin ist erforderlich'
    }
  }

  if ('leverage' in maybe) {
    const lval = maybe.leverage as number
    if (typeof lval !== 'number' || Number.isNaN(lval) || lval <= 0) {
      out.leverage = 'Leverage ist erforderlich'
    }
  }
  return out
}
