import { TradeSymbol } from '../value-objects/TradeSymbol'
import { EntryDate } from '../value-objects/EntryDate'
import { Price } from '../value-objects/Price'
import { Size } from '@/domain/trade/value-objects/Size'
import { TradeStatus } from '@/domain/trade/value-objects/TradeStatus'

export class Trade {
  // keep original public API types for compatibility
  public symbol: string
  public entryDate: string
  public size: number
  public price: number
  public notes?: string
  public status: string

  constructor(
    symbolInput: string,
    entryDateInput: string,
    sizeInput: number,
    priceInput: number,
    notes?: string,
    statusInput: string = 'OPEN'
  ) {
    // Use Value Objects to validate and normalize but re-expose primitives to keep API stable
    const tradeSymbol = new TradeSymbol(symbolInput)
    const entityDate = new EntryDate(entryDateInput)
    const sizeVo = new Size(Number(sizeInput))
    const priceVo = new Price(Number(priceInput))
    const statusVo = new TradeStatus(statusInput)

    this.symbol = tradeSymbol.toString()
    this.entryDate = entityDate.toString()
    this.size = sizeVo.toNumber()
    this.price = priceVo.toNumber()
    this.notes = notes
    this.status = statusVo.toString()
  }
}

export type TradeProps = {
  symbol: string
  entryDate: string
  size: number
  price: number
  notes?: string
  status?: string
}
