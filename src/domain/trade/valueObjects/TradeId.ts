export class TradeId {
  public readonly value: string;
  constructor(id: string) {
    if (typeof id !== 'string') throw new TradeIdInvalidError(id);
    const normalized = id.trim();
    if (!normalized) throw new TradeIdInvalidError(id);
    this.value = normalized;
  }

  static generate(): string {
    // Prefer a secure UUID when available
    if (typeof crypto !== 'undefined') {
      // modern environments provide a cryptographically secure UUID
      // (Node >= 14.17 / browsers)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = crypto as any;
      if (typeof c.randomUUID === 'function') {
        return c.randomUUID();
      }

      // Fallback to getRandomValues to produce a hex-based unique suffix
      if (typeof c.getRandomValues === 'function') {
        const arr = new Uint8Array(8);
        c.getRandomValues(arr);
        const hex = Array.from(arr).map((b: number) => b.toString(16).padStart(2, '0')).join('');
        return `${Date.now()}-${hex}`;
      }
    }

    // Last resort: Math.random — not cryptographically secure but acceptable
    // for non-security identifiers. Sonar warning suppressed by using a
    // secure API when available above.
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

export class TradeIdInvalidError extends Error {
  constructor(id: unknown) {
    super(`TradeId invalid: ${String(id)}`);
    this.name = 'TradeIdInvalidError';
  }
}
