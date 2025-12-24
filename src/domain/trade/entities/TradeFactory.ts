import { Trade } from './Trade'
import { Price } from '../valueObjects/Price'
import { Size } from '../valueObjects/Size'
import { EntryDate } from '../valueObjects/EntryDate'
import { TradeSymbol } from '../valueObjects/TradeSymbol'
import { Side } from '../valueObjects/Side'

export type TradeInput = {
  id: string
  symbol: string
  entryDate: string
  size: number
  price: number
  side: string
  notes?: string
}

export class TradeFactory {
  static create(input: TradeInput): Trade {
    return new Trade(
      input.id,
      new TradeSymbol(input.symbol),
      new EntryDate(input.entryDate),
      new Size(input.size),
      new Price(input.price),
      new Side(input.side),
      input.notes
    )
  }

  static toDTO(trade: Trade): TradeInput {
    return {
      id: trade.id,
      symbol: trade.symbol.value,
      entryDate: trade.entryDate.value,
      size: trade.size.value,
      price: trade.price.value,
      side: trade.side.value,
      notes: trade.notes
    }
  }
}
