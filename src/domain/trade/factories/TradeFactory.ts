import { Trade } from '../entities/Trade';
import { Price } from '../valueObjects/Price';
import { Size } from '../valueObjects/Size';
import { EntryDate } from '../valueObjects/EntryDate';
import { TradeSymbol } from '../valueObjects/TradeSymbol';
import { Side } from '../valueObjects/Side';
import { Market } from '../valueObjects/Market';
import { Leverage } from '../valueObjects/Leverage';
import { Margin } from '../valueObjects/Margin';
import { TradeId } from '../valueObjects/TradeId';
import { AnalysisId } from '../valueObjects/AnalysisId';
import { Status } from '../valueObjects/Status';
import { Notes } from '../valueObjects/Notes';

export type TradeInput = {
  id: string;
  symbol: string;
  entryDate?: string;
  size: number;
  price: number;
  side: string;
  status?: 'OPEN' | 'CLOSED' | 'FILLED';
  notes?: string;
  market?: string;
  margin?: number;
  sl?: number;
  slIsBE?: boolean;
  tp1?: number;
  tp2?: number;
  tp3?: number;
  tp4?: number;
  leverage?: number;
  analysisId?: string;
  userId?: string;
};

export class TradeFactory {
  static create(input: TradeInput): Trade {
    // If entryDate omitted (e.g. Add form hides it), default to now here in the factory
    const entryDateValue = input.entryDate ?? new Date().toISOString();
    // Treat stored numeric `0` as the break-even sentinel when loading legacy data
    const slIsBEFlag = input.slIsBE === true || (typeof input.sl === 'number' && input.sl === 0);
    const slVO = typeof input.sl === 'number' && input.sl !== 0 ? new Price(input.sl) : undefined;

    return new Trade(
      new TradeId(input.id),
      new TradeSymbol(input.symbol),
      new EntryDate(entryDateValue),
      new Size(input.size),
      new Price(input.price),
      new Side(input.side),
      new Market(input.market ?? 'All'),
      input.status ? new Status(input.status) : undefined,
      input.notes ? new Notes(input.notes) : undefined,
      slVO,
      slIsBEFlag === true ? true : undefined,
      typeof input.tp1 === 'number' ? new Price(input.tp1) : undefined,
      typeof input.tp2 === 'number' ? new Price(input.tp2) : undefined,
      typeof input.tp3 === 'number' ? new Price(input.tp3) : undefined,
      typeof input.tp4 === 'number' ? new Price(input.tp4) : undefined,
      typeof input.leverage === 'number' ? new Leverage(input.leverage) : undefined,
      typeof input.margin === 'number' ? new Margin(input.margin) : undefined,
      input.analysisId ? new AnalysisId(input.analysisId) : undefined,
      input.userId
    );
  }

  static toDTO(trade: Trade): TradeInput {
    return {
      id: trade.id.value,
      symbol: trade.symbol.value,
      // For presentation (inputs) provide a value suitable for <input type="datetime-local">
      entryDate: EntryDate.toInputValue(trade.entryDate.value),
      size: trade.size.value,
      price: trade.price.value,
      side: trade.side.value,
      // Normalize status to a primitive and provide a sensible default to avoid UNKNOWN states in UI
      status: trade.status?.value ?? 'OPEN',
      notes: trade.notes?.value,
      market: trade.market.value,
      // Persist numeric 0.0 when SL is break-even so future features (fees, adjustments)
      // can operate on a numeric sentinel. Otherwise expose actual SL price.
      sl: trade.slIsBE === true ? 0.0 : trade.sl?.value,
      tp1: trade.tp1?.value,
      tp2: trade.tp2?.value,
      tp3: trade.tp3?.value,
      tp4: trade.tp4?.value,
      leverage: trade.leverage?.value,
      margin: trade.margin?.value,
      slIsBE: trade.slIsBE,
      userId: trade.userId,
      analysisId: trade.analysisId?.value,
    };
  }
}
