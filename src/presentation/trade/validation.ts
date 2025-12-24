import { TradeInput } from '@/domain/trade/entities/TradeFactory'

export type TradeField = keyof TradeInput

export function validateTrade(input: TradeInput): Record<TradeField, string | undefined> {
  const errors: Record<TradeField, string | undefined> = {
    id: undefined,
    symbol: undefined,
    entryDate: undefined,
    size: undefined,
    price: undefined,
    notes: undefined
  }
  if (!input.symbol) errors.symbol = 'Symbol erforderlich'
  if (!input.entryDate) errors.entryDate = 'Datum erforderlich'
  if (!input.size || input.size <= 0) errors.size = 'Größe muss positiv sein'
  if (!input.price || input.price <= 0) errors.price = 'Preis muss positiv sein'
  return errors
}

export function validateAll(inputs: TradeInput[]): Record<string, Record<TradeField, string | undefined>> {
  return Object.fromEntries(inputs.map(i => [i.id, validateTrade(i)]))
}

