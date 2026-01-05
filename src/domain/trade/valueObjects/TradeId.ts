export class TradeId {
  public readonly value: string;
  constructor(id: string) {
    if (typeof id !== 'string') throw new TradeIdInvalidError(id);
    const normalized = id.trim();
    if (!normalized) throw new TradeIdInvalidError(id);
    this.value = normalized;
  }

  static generate(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

export class TradeIdInvalidError extends Error {
  constructor(id: unknown) {
    super(`TradeId invalid: ${String(id)}`);
    this.name = 'TradeIdInvalidError';
  }
}
