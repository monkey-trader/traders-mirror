import { TradeSymbol } from '../value-objects/TradeSymbol'
import { EntryDate } from '../value-objects/EntryDate'
import { Price } from '../value-objects/Price'
import { Size } from '../value-objects/Size'

export class Trade {
  // keep original public API types for compatibility
  public symbol: string
  public entryDate: string
  public size: number
  public price: number
  public notes?: string

  constructor(
    symbol: string,
    entryDate: string,
    size: number,
    price: number,
    notes?: string
  ) {
    // Use Value Objects to validate and normalize but re-expose primitives to keep API stable
    const s = new TradeSymbol(symbol)
    const d = new EntryDate(entryDate)
    const sz = new Size(Number(size))
    const p = new Price(Number(price))

    this.symbol = s.toString()
    this.entryDate = d.toString()
    this.size = sz.toNumber()
    this.price = p.toNumber()
    this.notes = notes
  }
}

export type TradeProps = {
  symbol: string
  entryDate: string
  size: number
  price: number
  notes?: string
}
