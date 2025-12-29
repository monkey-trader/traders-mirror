import { describe, it, expect } from 'vitest';
import { Price, PriceMustBePositiveError } from './Price';

describe('Price VO', () => {
  it('accepts positive numbers', () => {
    const price = new Price(123.45);
    expect(price).toBeInstanceOf(Price);
    expect(price.value).toBe(123.45);
  });

  it('throws PriceMustBePositiveError for zero', () => {
    expect(() => new Price(0)).toThrow(PriceMustBePositiveError);
  });

  it('throws PriceMustBePositiveError for negative numbers', () => {
    expect(() => new Price(-10)).toThrow(PriceMustBePositiveError);
  });
});
