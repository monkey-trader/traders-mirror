import { Trade } from './Trade'
import { Price } from '../valueObjects/Price'
import { Size } from '../valueObjects/Size'
import { EntryDate } from '../valueObjects/EntryDate'
import { TradeSymbol } from '../valueObjects/TradeSymbol'
import { Side } from '../valueObjects/Side'
import { Market } from '../valueObjects/Market'
import { Leverage } from '../valueObjects/Leverage'

export type TradeInput = {
  id: string
  symbol: string
  entryDate?: string
  size: number
  price: number
  side: string
  notes?: string
  market?: string
  sl?: number
  tp1?: number
  tp2?: number
  tp3?: number
  leverage?: number
}

export class TradeFactory {
  static create(input: TradeInput): Trade {
    // If entryDate omitted (e.g. Add form hides it), default to now here in the factory
    const entryDateValue = input.entryDate ?? new Date().toISOString()
    return new Trade(
      input.id,
      new TradeSymbol(input.symbol),
      new EntryDate(entryDateValue),
      new Size(input.size),
      new Price(input.price),
      new Side(input.side),
      new Market(input.market ?? 'All'),
      input.notes,
      typeof input.sl === 'number' ? new Price(input.sl) : undefined,
      typeof input.tp1 === 'number' ? new Price(input.tp1) : undefined,
      typeof input.tp2 === 'number' ? new Price(input.tp2) : undefined,
      typeof input.tp3 === 'number' ? new Price(input.tp3) : undefined,
      typeof input.leverage === 'number' ? new Leverage(input.leverage) : undefined
    )
  }

  static toDTO(trade: Trade): TradeInput {
    return {
      id: trade.id,
      symbol: trade.symbol.value,
      // For presentation (inputs) provide a value suitable for <input type="datetime-local">
      entryDate: EntryDate.toInputValue(trade.entryDate.value),
      size: trade.size.value,
      price: trade.price.value,
      side: trade.side.value,
      notes: trade.notes,
      market: trade.market.value,
      sl: trade.sl?.value,
      tp1: trade.tp1?.value,
      tp2: trade.tp2?.value,
      tp3: trade.tp3?.value,
      leverage: trade.leverage?.value
    }
  }
}
