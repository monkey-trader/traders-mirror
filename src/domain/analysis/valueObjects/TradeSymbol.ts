import { TradeSymbolInvalidError } from '@/domain/analysis/errors/TradeSymbolInvalidError';

export class TradeSymbol {
  public readonly value: string;

  constructor(input: unknown) {
    if (typeof input !== 'string') throw new TradeSymbolInvalidError('Symbol must be a string');
    const normalized = input.trim().toUpperCase();
    if (!normalized) throw new TradeSymbolInvalidError('Symbol must not be empty');
    // allowed chars: letters, numbers, - and /\
    if (!/^[A-Z0-9_\-/.]+$/.test(normalized)) {
      throw new TradeSymbolInvalidError('Symbol contains invalid characters');
    }
    this.value = normalized;
  }
}
