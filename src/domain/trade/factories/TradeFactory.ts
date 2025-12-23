import { Trade } from '@/domain/trade/entities/Trade'
import { TradeSymbol } from '@/domain/trade/value-objects/TradeSymbol'
import { EntryDate } from '@/domain/trade/value-objects/EntryDate'
import { Price } from '@/domain/trade/value-objects/Price'
import { Size } from '@/domain/trade/value-objects/Size'
import type { TradeProps } from '@/domain/trade/entities/Trade'

export type TradeInput =
  | TradeProps
  | {
      symbol: string | TradeSymbol
      entryDate: string | Date | EntryDate
      size: number | Size
      price: number | Price
      notes?: string
    }

export class TradeFactory {
  static create(input: TradeInput): Trade {
    // Normalize to primitives using VOs for validation
    const symbol = input.symbol
    const entryDate = input.entryDate
    const size = input.size
    const price = input.price
    const notes = input.notes

    const symVo = symbol instanceof TradeSymbol ? symbol : new TradeSymbol(String(symbol))
    const dateVo = entryDate instanceof EntryDate ? entryDate : new EntryDate(entryDate as string | Date)
    const sizeVo = size instanceof Size ? size : new Size(Number(size))
    const priceVo = price instanceof Price ? price : new Price(Number(price))

    return new Trade(symVo.toString(), dateVo.toString(), sizeVo.toNumber(), priceVo.toNumber(), notes)
  }
}
