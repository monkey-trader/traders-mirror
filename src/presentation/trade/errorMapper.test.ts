import { describe, it, expect } from 'vitest'
import { mapTradeError } from './errorMapper'
import { TradeSymbolInvalidError } from '@/domain/trade/valueObjects/TradeSymbol'
import { EntryDateInvalidError } from '@/domain/trade/valueObjects/EntryDate'
import { SizeMustBePositiveError } from '@/domain/trade/valueObjects/Size'
import { PriceMustBePositiveError } from '@/domain/trade/valueObjects/Price'

describe('mapTradeError', () => {
  it('maps TradeSymbolInvalidError', () => {
    expect(mapTradeError(new TradeSymbolInvalidError(''))).toEqual({ field: 'symbol', message: 'Ungültiges Symbol' })
  })
  it('maps EntryDateInvalidError', () => {
    expect(mapTradeError(new EntryDateInvalidError(''))).toEqual({ field: 'entryDate', message: 'Ungültiges Datum' })
  })
  it('maps SizeMustBePositiveError', () => {
    expect(mapTradeError(new SizeMustBePositiveError(0))).toEqual({ field: 'size', message: 'Größe muss positiv sein' })
  })
  it('maps PriceMustBePositiveError', () => {
    expect(mapTradeError(new PriceMustBePositiveError(0))).toEqual({ field: 'price', message: 'Preis muss positiv sein' })
  })
  it('maps unknown error', () => {
    expect(mapTradeError(new Error('foo'))).toEqual({ message: 'Unbekannter Fehler' })
  })
})
