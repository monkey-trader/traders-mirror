import { TradeSymbol } from '../valueObjects/TradeSymbol'
import { EntryDate } from '../valueObjects/EntryDate'
import { Size } from '../valueObjects/Size'
import { Price } from '../valueObjects/Price'

export class Trade {
  public readonly id: string
  public readonly symbol: TradeSymbol
  public readonly entryDate: EntryDate
  public readonly size: Size
  public readonly price: Price
  public readonly notes?: string

  constructor(
    id: string,
    symbol: TradeSymbol,
    entryDate: EntryDate,
    size: Size,
    price: Price,
    notes?: string
  ) {
    this.id = id
    this.symbol = symbol
    this.entryDate = entryDate
    this.size = size
    this.price = price
    this.notes = notes
  }

  static update(trade: Trade, updates: Partial<{ symbol: string; entryDate: string; size: number; price: number; notes?: string }>): Trade {
    return new Trade(
      trade.id,
      updates.symbol ? new TradeSymbol(updates.symbol) : trade.symbol,
      updates.entryDate ? new EntryDate(updates.entryDate) : trade.entryDate,
      updates.size !== undefined ? new Size(updates.size) : trade.size,
      updates.price !== undefined ? new Price(updates.price) : trade.price,
      updates.notes !== undefined ? updates.notes : trade.notes
    )
  }
}
