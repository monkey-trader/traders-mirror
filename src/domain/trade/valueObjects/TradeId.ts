import { generateId } from '@/domain/shared/generateId';

export class TradeId {
  public readonly value: string;
  constructor(id: string) {
    if (typeof id !== 'string') throw new TradeIdInvalidError(id);
    const normalized = id.trim();
    if (!normalized) throw new TradeIdInvalidError(id);
    this.value = normalized;
  }

  static generate(): string {
    // If a native secure UUID is available, return it directly to preserve
    // the expected UUID format for consumers and tests.
    if (typeof crypto !== 'undefined') {
      // Narrow the global crypto to a minimal typed shape we use here.
      const c = crypto as unknown as {
        randomUUID?: () => string;
        getRandomValues?: (arr: Uint8Array) => void;
      };

      if (typeof c.randomUUID === 'function') {
        return c.randomUUID();
      }
    }

    // Otherwise use the shared generator which may include a prefix and
    // secure fallback using getRandomValues.
    return generateId('trade');
  }
}

export class TradeIdInvalidError extends Error {
  constructor(id: unknown) {
    super(`TradeId invalid: ${String(id)}`);
    this.name = 'TradeIdInvalidError';
  }
}
