import { describe, expect, test } from 'vitest';
import { Size } from './Size';

describe('Size VO', () => {
  test('accepts positive size', () => {
    const s = new Size(2);
    expect(s.toNumber()).toBe(2);
  });

  test('throws for non-number', () => {
    expect(() => new Size(NaN)).toThrow('Size must be a number');
  });

  test('throws for non-positive', () => {
    expect(() => new Size(0)).toThrow('Size must be positive');
  });
});

