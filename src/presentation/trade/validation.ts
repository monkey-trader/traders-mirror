import { TradeInput } from '@/domain/trade/entities/TradeFactory'

export type TradeField = keyof TradeInput

export function validateTrade(input: TradeInput): Record<TradeField, string | undefined> {
  const errors: Record<TradeField, string | undefined> = {
    id: undefined,
    symbol: undefined,
    entryDate: undefined,
    size: undefined,
    price: undefined,
    side: undefined,
    notes: undefined,
    market: undefined,
    sl: undefined,
    tp1: undefined,
    tp2: undefined,
    tp3: undefined,
    leverage: undefined
  }

  if (!input.symbol) errors.symbol = 'Symbol erforderlich'
  if (!input.entryDate) errors.entryDate = 'Datum erforderlich'
  if (!input.size || input.size <= 0) errors.size = 'Größe muss positiv sein'
  if (!input.price || input.price <= 0) errors.price = 'Preis muss positiv sein'
  if (!input.side || (input.side.trim().toUpperCase() !== 'LONG' && input.side.trim().toUpperCase() !== 'SHORT')) {
    errors.side = "Side muss 'LONG' oder 'SHORT' sein"
  }

  // basic market validation (presentation layer)
  if (typeof input.market !== 'undefined' && input.market !== null) {
    const m = String(input.market)
    if (!(m === 'All' || m === 'Forex' || m === 'Crypto')) {
      errors.market = 'Ungültiger Markt'
    }
  }

  // SL/TP: if provided, must be numeric
  const numericCheck = (val: unknown) => {
    if (val === undefined || val === null || val === '') return true
    const n = Number(val)
    return !Number.isNaN(n)
  }

  if (!numericCheck(input.sl)) errors.sl = 'SL muss eine Zahl sein'
  if (!numericCheck(input.tp1)) errors.tp1 = 'TP1 muss eine Zahl sein'
  if (!numericCheck(input.tp2)) errors.tp2 = 'TP2 muss eine Zahl sein'
  if (!numericCheck(input.tp3)) errors.tp3 = 'TP3 muss eine Zahl sein'

  // leverage: allow empty or numeric with optional trailing 'x' (e.g. '10' or '10x')
  if (typeof input.leverage !== 'undefined' && input.leverage !== null && String(input.leverage).trim() !== '') {
    const lv = String(input.leverage).trim()
    if (!/^\d+(\.\d+)?x?$/.test(lv)) errors.leverage = 'Leverage ungültig (z.B. 10 oder 10x)'
  }

  return errors
}

export function validateAll(inputs: TradeInput[]): Record<string, Record<TradeField, string | undefined>> {
  return Object.fromEntries(inputs.map(i => [i.id, validateTrade(i)]))
}
