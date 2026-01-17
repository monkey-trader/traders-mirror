import { TradeSymbol } from '../valueObjects/TradeSymbol';
import { EntryDate } from '../valueObjects/EntryDate';
import { Size } from '../valueObjects/Size';
import { Price } from '../valueObjects/Price';
import { Side } from '../valueObjects/Side';
import { Market } from '../valueObjects/Market';
import { Leverage } from '../valueObjects/Leverage';
import { Margin } from '../valueObjects/Margin';
import { TradeId } from '../valueObjects/TradeId';
import { AnalysisId } from '../valueObjects/AnalysisId';
import { Status } from '../valueObjects/Status';
import { Notes } from '../valueObjects/Notes';

export class Trade {
  public readonly id: TradeId;
  public readonly symbol: TradeSymbol;
  public readonly entryDate: EntryDate;
  public readonly size: Size;
  public readonly price: Price;
  public readonly side: Side;
  public readonly status?: Status;
  public readonly notes?: Notes;
  public readonly market: Market;
  public readonly sl?: Price;
  public readonly slIsBE?: boolean;
  public readonly tp1?: Price;
  public readonly tp2?: Price;
  public readonly tp3?: Price;
  public readonly tp4?: Price;
  public readonly leverage?: Leverage;
  public readonly margin?: Margin;
  public readonly analysisId?: AnalysisId; // link to originating Analysis (if any)
  public readonly userId?: string;

  constructor(
    id: TradeId,
    symbol: TradeSymbol,
    entryDate: EntryDate,
    size: Size,
    price: Price,
    side: Side,
    market: Market,
    status?: Status,
    notes?: Notes,
    sl?: Price,
    slIsBE?: boolean,
    tp1?: Price,
    tp2?: Price,
    tp3?: Price,
    tp4?: Price,
    leverage?: Leverage,
    margin?: Margin,
    analysisId?: AnalysisId,
    userId?: string
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
    this.slIsBE = slIsBE;
    this.tp1 = tp1;
    this.tp2 = tp2;
    this.tp3 = tp3;
    this.tp4 = tp4;
    this.leverage = leverage;
    this.margin = margin;
    this.analysisId = analysisId;
    this.userId = userId;
  }
}
