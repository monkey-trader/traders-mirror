import { TradeSymbol } from '../valueObjects/TradeSymbol'
import { EntryDate } from '../valueObjects/EntryDate'
import { Size } from '../valueObjects/Size'
import { Price } from '../valueObjects/Price'
import { Side } from '../valueObjects/Side'

export class Trade {
  public readonly id: string
  public readonly symbol: TradeSymbol
  public readonly entryDate: EntryDate
  public readonly size: Size
  public readonly price: Price
  public readonly side: Side
  public readonly notes?: string

  constructor(
    id: string,
    symbol: TradeSymbol,
    entryDate: EntryDate,
    size: Size,
    price: Price,
    side: Side,
    notes?: string
  ) {
    this.id = id
    this.symbol = symbol
    this.entryDate = entryDate
    this.size = size
    this.price = price
    this.side = side
    this.notes = notes
  }
}
