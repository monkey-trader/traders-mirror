import { describe, it, expect } from 'vitest';
import { TradeFactory } from '../factories/TradeFactory';
import { TradeSymbolInvalidError } from '../valueObjects/TradeSymbol';
import { EntryDateInvalidError } from '../valueObjects/EntryDate';
import { SizeMustBePositiveError } from '../valueObjects/Size';
import { PriceMustBePositiveError } from '../valueObjects/Price';
import { TradeId } from '../valueObjects/TradeId';
import { AnalysisId } from '../valueObjects/AnalysisId';

describe('TradeFactory', () => {
  it('should create a valid Trade', () => {
    const trade = TradeFactory.create({
      id: ' 1 ',
      symbol: 'AAPL',
      entryDate: '2023-01-01T00:00:00Z',
      size: 10,
      price: 100,
      side: 'LONG',
      notes: 'Test',
      analysisId: ' ref-1 ',
    });
    expect(trade.symbol.value).toBe('AAPL');
    expect(trade.entryDate.value).toBe('2023-01-01T00:00:00.000Z');
    expect(trade.size.value).toBe(10);
    expect(trade.price.value).toBe(100);
    expect(trade.notes).toBe('Test');
    expect(trade.id).toBeInstanceOf(TradeId);
    expect(trade.analysisId).toBeInstanceOf(AnalysisId);
    expect(trade.analysisId?.value).toBe('REF-1');
  });

  it('should throw on invalid symbol', () => {
    expect(() =>
      TradeFactory.create({
        id: '1',
        symbol: '',
        entryDate: '2023-01-01T00:00:00Z',
        size: 10,
        price: 100,
        side: 'LONG',
      })
    ).toThrow(TradeSymbolInvalidError);
  });

  it('should throw on invalid entryDate', () => {
    expect(() =>
      TradeFactory.create({
        id: '1',
        symbol: 'AAPL',
        entryDate: 'invalid',
        size: 10,
        price: 100,
        side: 'LONG',
      })
    ).toThrow(EntryDateInvalidError);
  });

  it('should throw on invalid size', () => {
    expect(() =>
      TradeFactory.create({
        id: '1',
        symbol: 'AAPL',
        entryDate: '2023-01-01T00:00:00Z',
        size: 0,
        price: 100,
        side: 'LONG',
      })
    ).toThrow(SizeMustBePositiveError);
  });

  it('should throw on invalid price', () => {
    expect(() =>
      TradeFactory.create({
        id: '1',
        symbol: 'AAPL',
        entryDate: '2023-01-01T00:00:00Z',
        size: 10,
        price: 0,
        side: 'LONG',
      })
    ).toThrow(PriceMustBePositiveError);
  });
});
