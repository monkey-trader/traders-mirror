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
  entryDate: string
  size: number
  price: number
  side: string
  notes?: string
  market?: string
  sl?: number | string
  tp1?: number | string
  tp2?: number | string
  tp3?: number | string
  leverage?: string
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
      new Market(input.market ?? 'All'),
      input.notes,
      input.sl ? new Price(Number(input.sl)) : undefined,
      input.tp1 ? new Price(Number(input.tp1)) : undefined,
      input.tp2 ? new Price(Number(input.tp2)) : undefined,
      input.tp3 ? new Price(Number(input.tp3)) : undefined,
      input.leverage ? new Leverage(input.leverage) : undefined
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
