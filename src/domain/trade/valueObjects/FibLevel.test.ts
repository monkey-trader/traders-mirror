import { describe, it, expect } from 'vitest';
import { FibLevel, ALLOWED_FIB_LEVELS } from './FibLevel';

describe('FibLevel VO', () => {
  it('accepts allowed fib levels', () => {
    for (const v of ALLOWED_FIB_LEVELS) {
      const f = new FibLevel(v);
      expect(f.value).toBe(v);
    }
  });

  it('throws on invalid fib level', () => {
    expect(() => new FibLevel('Fib 0.123')).toThrow();
    expect(() => new FibLevel('')).toThrow();
  });
});
