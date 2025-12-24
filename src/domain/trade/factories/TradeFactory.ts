import { Trade } from '@/domain/trade/entities/Trade'
import { TradeSymbol } from '@/domain/trade/value-objects/TradeSymbol'
import { EntryDate } from '@/domain/trade/value-objects/EntryDate'
import { Price } from '@/domain/trade/value-objects/Price'
import { Size } from '@/domain/trade/value-objects/Size'
import { TradeStatus } from '@/domain/trade/value-objects/TradeStatus'
import type { TradeProps } from '@/domain/trade/entities/Trade'
import type { TradeTargetDTO } from '@/domain/trade/value-objects/TradeTarget'
import { TradeTarget } from '@/domain/trade/value-objects/TradeTarget'

export type TradeInput =
  | TradeProps
  | {
      symbol: string | TradeSymbol
      entryDate: string | Date | EntryDate
      size: number | Size
      price: number | Price
      notes?: string
      status?: string | TradeStatus
      targets?: TradeTargetDTO[] | TradeTarget[]
      legs?: TradeTargetDTO[] | TradeTarget[]
    }

function isTradeProps(obj: unknown): obj is TradeProps {
  return typeof obj === 'object' && obj !== null && 'symbol' in obj && 'entryDate' in obj && 'size' in obj && 'price' in obj
}

function isTradeTargetInstanceArray(arr: unknown): arr is TradeTarget[] {
  return Array.isArray(arr) && arr.every((i) => i instanceof TradeTarget)
}

export class TradeFactory {
  static create(input: TradeInput): Trade {
    let symbolValue: string | TradeSymbol | undefined
    let entryDateValue: string | Date | EntryDate | undefined
    let sizeValue: number | Size | undefined
    let priceValue: number | Price | undefined
    let notesValue: string | undefined
    let statusValue: string | TradeStatus | undefined
    let targetsValue: TradeTargetDTO[] | TradeTarget[] | undefined
    let legsValue: TradeTargetDTO[] | TradeTarget[] | undefined

    if (isTradeProps(input)) {
      symbolValue = input.symbol
      entryDateValue = input.entryDate
      sizeValue = input.size
      priceValue = input.price
      notesValue = input.notes
      statusValue = input.status as string | TradeStatus | undefined
      targetsValue = input.targets
      // Support legacy `legs` field even when input matches TradeProps shape
      legsValue = (input as unknown as { legs?: TradeTargetDTO[] | TradeTarget[] }).legs
    } else {
      symbolValue = input.symbol
      entryDateValue = input.entryDate
      sizeValue = input.size
      priceValue = input.price
      notesValue = input.notes
      statusValue = input.status
      targetsValue = input.targets
      legsValue = input.legs
    }

    const symVo = symbolValue instanceof TradeSymbol ? symbolValue : new TradeSymbol(String(symbolValue))
    const dateVo = entryDateValue instanceof EntryDate ? entryDateValue : new EntryDate(entryDateValue as string | Date)
    const sizeVo = sizeValue instanceof Size ? sizeValue : new Size(Number(sizeValue))
    const priceVo = priceValue instanceof Price ? priceValue : new Price(Number(priceValue))
    const statusVo = statusValue instanceof TradeStatus ? statusValue : new TradeStatus(statusValue ?? 'OPEN')

    const candidates = targetsValue ?? legsValue
    let targetsPrimitives: TradeTargetDTO[] | undefined = undefined
    if (candidates !== undefined) {
      if (isTradeTargetInstanceArray(candidates)) targetsPrimitives = candidates.map((t) => t.toPrimitive())
      else if (Array.isArray(candidates)) {
        targetsPrimitives = candidates.map((t) => {
          const instance = t instanceof TradeTarget ? t : new TradeTarget(t as TradeTargetDTO)
          return instance.toPrimitive()
        })
      }
    }

    return new Trade(
      symVo.toString(),
      dateVo.toString(),
      sizeVo.toNumber(),
      priceVo.toNumber(),
      notesValue,
      statusVo.toString(),
      targetsPrimitives
    )
  }
}
