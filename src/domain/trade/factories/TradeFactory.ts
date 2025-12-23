import { Trade } from '@/domain/trade/entities/Trade'
import { TradeSymbol } from '@/domain/trade/value-objects/TradeSymbol'
import { EntryDate } from '@/domain/trade/value-objects/EntryDate'
import { Price } from '@/domain/trade/value-objects/Price'
import { Size } from '@/domain/trade/value-objects/Size'
import { TradeStatus } from '@/domain/trade/value-objects/TradeStatus'
import type { TradeProps } from '@/domain/trade/entities/Trade'

export type TradeInput =
  | TradeProps
  | {
      symbol: string | TradeSymbol
      entryDate: string | Date | EntryDate
      size: number | Size
      price: number | Price
      notes?: string
      status?: string | TradeStatus
    }

export class TradeFactory {
  static create(input: TradeInput): Trade {
    // Normalize to primitives using VOs for validation
    const symbol = (input as any).symbol
    const entryDate = (input as any).entryDate
    const size = (input as any).size
    const price = (input as any).price
    const notes = (input as any).notes
    const status = (input as any).status

    const symVo = symbol instanceof TradeSymbol ? symbol : new TradeSymbol(String(symbol))
    const dateVo = entryDate instanceof EntryDate ? entryDate : new EntryDate(entryDate as string | Date)
    const sizeVo = size instanceof Size ? size : new Size(Number(size))
    const priceVo = price instanceof Price ? price : new Price(Number(price))
    const statusVo = status instanceof TradeStatus ? status : new TradeStatus(status ?? 'OPEN')

    return new Trade(symVo.toString(), dateVo.toString(), sizeVo.toNumber(), priceVo.toNumber(), notes, statusVo.toString())
  }
}
