import { EntryDateInvalidError } from '@/domain/analysis/errors/EntryDateInvalidError';
import { TradeSymbolInvalidError } from '@/domain/analysis/errors/TradeSymbolInvalidError';
import { TradingViewLinkInvalidError } from '@/domain/analysis/errors/TradingViewLinkInvalidError';

type ValidationLike = { field?: string; message?: string };

export function mapDomainErrorToUI(err: unknown) {
  // if it's a plain validation-like object, re-expose its field/message
  if (err && typeof err === 'object') {
    const maybe = err as ValidationLike;
    if (typeof maybe.field === 'string' || typeof maybe.message === 'string') {
      return { field: maybe.field, message: maybe.message };
    }
  }

  if (err instanceof TradeSymbolInvalidError)
    return { field: 'symbol', message: 'Symbol ist ungültig' };
  if (err instanceof EntryDateInvalidError)
    return { field: 'entryDate', message: 'Datum ist ungültig' };
  if (err instanceof TradingViewLinkInvalidError)
    return { field: 'tradingViewLink', message: 'TradingView Link ist ungültig' };
  return { field: undefined, message: 'Unbekannter Fehler' };
}

// backward-compatible alias expected by tests
export const mapAnalysisError = mapDomainErrorToUI;
