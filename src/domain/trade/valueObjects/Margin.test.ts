import { describe, it, expect } from 'vitest';
import { Margin, MarginMustBePositiveError } from './Margin';

describe('Margin Value Object', () => {
  it('should create a Margin for positive values', () => {
    expect(new Margin(1).value).toBe(1);
    expect(new Margin(100).value).toBe(100);
  });

  it('should throw for zero or negative values', () => {
    expect(() => new Margin(0)).toThrow(MarginMustBePositiveError);
    expect(() => new Margin(-1)).toThrow(MarginMustBePositiveError);
  });

  it('should throw for NaN or non-number', () => {
    expect(() => new Margin(NaN)).toThrow(MarginMustBePositiveError);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- autofix: preserve tests that intentionally use any
    expect(() => new Margin(undefined as any)).toThrow(MarginMustBePositiveError);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- autofix: preserve tests that intentionally use any
    expect(() => new Margin('foo' as any)).toThrow(MarginMustBePositiveError);
  });
});
