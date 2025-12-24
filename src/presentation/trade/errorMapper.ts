import { TradeSymbolInvalidError } from '@/domain/trade/valueObjects/TradeSymbol'
import { EntryDateInvalidError } from '@/domain/trade/valueObjects/EntryDate'
import { SizeMustBePositiveError } from '@/domain/trade/valueObjects/Size'
import { PriceMustBePositiveError } from '@/domain/trade/valueObjects/Price'

export function mapTradeError(error: unknown): { field?: string; message: string } {
  if (error instanceof TradeSymbolInvalidError) return { field: 'symbol', message: 'Ungültiges Symbol' }
  if (error instanceof EntryDateInvalidError) return { field: 'entryDate', message: 'Ungültiges Datum' }
  if (error instanceof SizeMustBePositiveError) return { field: 'size', message: 'Größe muss positiv sein' }
  if (error instanceof PriceMustBePositiveError) return { field: 'price', message: 'Preis muss positiv sein' }
  return { message: 'Unbekannter Fehler' }
}

