export const ALLOWED_FIB_LEVELS = ['Fib 0.5', 'Fib 0.559', 'Fib 0.618', 'Fib 0.667', 'Fib 0.786'] as const;
export type FibLevelValue = typeof ALLOWED_FIB_LEVELS[number];

export class FibLevel {
  public readonly value: FibLevelValue;

  constructor(value: string) {
    if (value === undefined || value === null) throw new Error('FibLevel required');
    const s = String(value).trim();
    if (s.length === 0) throw new Error('FibLevel cannot be empty');
    if (!(ALLOWED_FIB_LEVELS as readonly string[]).includes(s)) {
      throw new Error(`FibLevel invalid: ${s}`);
    }
    this.value = s as FibLevelValue;
  }

  toString() {
    return this.value;
  }
}
