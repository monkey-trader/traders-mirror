import type { MarketValue } from '@/presentation/shared/components/MarketSelect/MarketSelect'
import type { TradeInput } from '@/domain/trade/entities/TradeFactory'

export type TradeForm = {
  symbol: string
  entryDate: string
  size: number
  price: number
  side: string
  market: MarketValue
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
  if (Number.isNaN(input.price) || input.price <= 0) {
    errors.push({ field: 'price', message: 'Preis muss eine positive Zahl sein' })
  }
  if (Number.isNaN(input.size) || input.size <= 0) {
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

  if (typeof input.margin !== 'number' || Number.isNaN(input.margin)) {
    errors.push({ field: 'margin', message: 'Margin ist erforderlich' })
  } else if (input.margin <= 0) {
    errors.push({ field: 'margin', message: 'Margin muss eine positive Zahl sein' })
  }

  if (typeof input.leverage !== 'number' || Number.isNaN(input.leverage)) {
    errors.push({ field: 'leverage', message: 'Leverage ist erforderlich' })
  } else if (input.leverage <= 0) {
    errors.push({ field: 'leverage', message: 'Leverage muss eine positive Zahl sein' })
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
  const priceValue = Number(maybe.price as unknown)
  if (Number.isNaN(priceValue) || priceValue <= 0) {
    out.price = 'Preis muss eine positive Zahl sein'
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
  if (typeof maybe.sl !== 'number' || Number.isNaN(maybe.sl as number)) {
    out.sl = 'Stop Loss (SL) ist erforderlich'
  }
  if (typeof maybe.margin !== 'number' || Number.isNaN(maybe.margin as number)) {
    out.margin = 'Margin ist erforderlich'
  } else if ((maybe.margin as number) <= 0) {
    out.margin = 'Margin muss eine positive Zahl sein'
  }
  if (typeof maybe.leverage !== 'number' || Number.isNaN(maybe.leverage as number)) {
    out.leverage = 'Leverage ist erforderlich'
  } else if ((maybe.leverage as number) <= 0) {
    out.leverage = 'Leverage muss eine positive Zahl sein'
  }
  return out
}
