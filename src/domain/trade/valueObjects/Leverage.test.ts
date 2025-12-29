import { describe, it, expect } from 'vitest';
import { Leverage } from './Leverage';

describe('Leverage VO', () => {
  it('accepts undefined and numeric values', () => {
    expect(new Leverage().value).toBeUndefined();
    expect(new Leverage(10).value).toBe(10);
  });

  it('throws on invalid numbers (<=0 or NaN)', () => {
    expect(() => new Leverage(0)).toThrow();
    expect(() => new Leverage(-5)).toThrow();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- autofix: preserve tests that intentionally use any
    expect(() => new Leverage(Number('abc' as any))).toThrow();
  });
});
