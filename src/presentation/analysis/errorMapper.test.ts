import { describe, it, expect } from 'vitest';
import { mapDomainErrorToUI, mapAnalysisError } from './errorMapper';
import { TradeSymbolInvalidError } from '@/domain/analysis/errors/TradeSymbolInvalidError';
import { EntryDateInvalidError } from '@/domain/analysis/errors/EntryDateInvalidError';
import { TradingViewLinkInvalidError } from '@/domain/analysis/errors/TradingViewLinkInvalidError';

describe('analysis errorMapper', () => {
  it('re-exposes plain validation-like objects', () => {
    const plain = { field: 'symbol', message: 'bad' };
    expect(mapDomainErrorToUI(plain)).toEqual({ field: 'symbol', message: 'bad' });
  });

  it('re-exposes Error.message for generic Error instances', () => {
    expect(mapDomainErrorToUI(new Error('x'))).toEqual({ field: undefined, message: 'x' });
  });

  it('maps domain error prototypes to German messages when not a plain validation-like object', () => {
    // craft objects that are instanceof the error classes but don't expose a message property
    const protoSymbol = Object.create(TradeSymbolInvalidError.prototype) as unknown;
    (protoSymbol as unknown as { message?: unknown }).message = undefined;
    expect(mapDomainErrorToUI(protoSymbol)).toEqual({
      field: 'symbol',
      message: 'Symbol ist ungültig',
    });

    const protoDate = Object.create(EntryDateInvalidError.prototype) as unknown;
    (protoDate as unknown as { message?: unknown }).message = undefined;
    expect(mapDomainErrorToUI(protoDate)).toEqual({
      field: 'entryDate',
      message: 'Datum ist ungültig',
    });

    const protoTv = Object.create(TradingViewLinkInvalidError.prototype) as unknown;
    (protoTv as unknown as { message?: unknown }).message = undefined;
    expect(mapDomainErrorToUI(protoTv)).toEqual({
      field: 'tradingViewLink',
      message: 'TradingView Link ist ungültig',
    });

    expect(mapAnalysisError).toBe(mapDomainErrorToUI);
  });

  it('maps validation-like error', () => {
    const err = { field: 'price', message: 'invalid' };
    const mapped = mapAnalysisError(err);
    expect(mapped.field).toBe('price');
  });

  it('maps unknown error to generic message', () => {
    const mapped = mapAnalysisError(new Error('boom'));
    expect(mapped.message).toBeDefined();
  });
});
