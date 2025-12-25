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
  if (!input.symbol || String(input.symbol).trim().length === 0) {
    out.symbol = 'Symbol ist erforderlich'
  }
  if (!input.entryDate || String(input.entryDate).trim().length === 0) {
    out.entryDate = 'Entry Date ist erforderlich'
  } else if (isNaN(Date.parse(String(input.entryDate)))) {
    out.entryDate = 'Entry Date ist ungültig'
  }
  if (Number.isNaN(input.price as number) || (input.price as number) <= 0) {
    out.price = 'Preis muss eine positive Zahl sein'
  }
  if (Number.isNaN(input.size as number) || (input.size as number) <= 0) {
    out.size = 'Größe muss positiv sein'
  }
  if (!input.side || (input.side !== 'LONG' && input.side !== 'SHORT')) {
    out.side = 'Seite muss LONG oder SHORT sein'
  }
  // For detail editor we accept market optional, but if present validate
  if (typeof input.market !== 'undefined' && input.market !== null) {
    const m = String(input.market)
    if (m !== 'Forex' && m !== 'Crypto' && m !== 'All' && m !== '') {
      out.market = 'Ungültiger Markt'
    }
  }
  // Require SL, margin, leverage in detail editor as numbers
  if (typeof (input as any).sl !== 'number' || Number.isNaN((input as any).sl)) {
    out.sl = 'Stop Loss (SL) ist erforderlich'
  }
  if (typeof (input as any).margin !== 'number' || Number.isNaN((input as any).margin)) {
    out.margin = 'Margin ist erforderlich'
  } else if ((input as any).margin <= 0) {
    out.margin = 'Margin muss eine positive Zahl sein'
  }
  if (typeof (input as any).leverage !== 'number' || Number.isNaN((input as any).leverage)) {
    out.leverage = 'Leverage ist erforderlich'
  } else if ((input as any).leverage <= 0) {
    out.leverage = 'Leverage muss eine positive Zahl sein'
  }
  return out
}
