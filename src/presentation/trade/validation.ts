import type { MarketValue } from '@/presentation/shared/components/MarketSelect/MarketSelect'
import type { TradeInput } from '@/domain/trade/entities/TradeFactory'

export type TradeForm = {
  symbol: string
  entryDate: string
  size: number
  price: number
  side: string
  market: MarketValue
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
  if (typeof input.price !== 'number' || Number.isNaN(input.price) || input.price <= 0) {
    errors.push({ field: 'price', message: 'Preis muss eine positive Zahl sein' })
  }
  if (typeof input.size !== 'number' || Number.isNaN(input.size) || input.size <= 0) {
    errors.push({ field: 'size', message: 'Größe muss positiv sein' })
  }
  if (!input.side || (input.side !== 'LONG' && input.side !== 'SHORT')) {
    errors.push({ field: 'side', message: 'Seite muss LONG oder SHORT sein' })
  }
  if (!input.market || (input.market !== 'Forex' && input.market !== 'Crypto')) {
    errors.push({ field: 'market', message: 'Bitte Markt auswählen' })
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
  if (typeof input.price !== 'number' || Number.isNaN(input.price) || input.price <= 0) {
    out.price = 'Preis muss eine positive Zahl sein'
  }
  if (typeof input.size !== 'number' || Number.isNaN(input.size) || input.size <= 0) {
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
  return out
}
