import { TradeSymbol } from '../valueObjects/TradeSymbol'
import { EntryDate } from '../valueObjects/EntryDate'
import { Size } from '../valueObjects/Size'
import { Price } from '../valueObjects/Price'
import { Side } from '../valueObjects/Side'
import { Market } from '../valueObjects/Market'
import { Leverage } from '../valueObjects/Leverage'
import { Margin } from '../valueObjects/Margin'

export class Trade {
  public readonly id: string;
  public readonly symbol: TradeSymbol;
  public readonly entryDate: EntryDate;
  public readonly size: Size;
  public readonly price: Price;
  public readonly side: Side;
  public readonly status?: 'OPEN' | 'CLOSED' | 'FILLED';
  public readonly notes?: string;
  public readonly market: Market;
  public readonly sl?: Price;
  public readonly tp1?: Price;
  public readonly tp2?: Price;
  public readonly tp3?: Price;
  public readonly tp4?: Price;
  public readonly leverage?: Leverage;
  public readonly margin?: Margin;

  constructor(
    id: string,
    symbol: TradeSymbol,
    entryDate: EntryDate,
    size: Size,
    price: Price,
    side: Side,
    market: Market,
    status?: 'OPEN' | 'CLOSED' | 'FILLED',
    notes?: string,
    sl?: Price,
    tp1?: Price,
    tp2?: Price,
    tp3?: Price,
    tp4?: Price,
    leverage?: Leverage,
    margin?: Margin,
  ) {
    this.id = id;
    this.symbol = symbol;
    this.entryDate = entryDate;
    this.size = size;
    this.price = price;
    this.side = side;
    this.status = status;
    this.market = market;
    this.notes = notes;
    this.sl = sl;
    this.tp1 = tp1;
    this.tp2 = tp2;
    this.tp3 = tp3;
    this.tp4 = tp4;
    this.leverage = leverage;
    this.margin = margin;
  }
}
