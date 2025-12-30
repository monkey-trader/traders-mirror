import { toggleSide, chooseSlFromEntry } from './tradeHelpers';

describe('tradeHelpers', () => {
  test('toggleSide flips LONG to SHORT and vice versa', () => {
    expect(toggleSide('LONG')).toBe('SHORT');
    expect(toggleSide('SHORT')).toBe('LONG');
  });

  test('chooseSlFromEntry returns numeric entry when valid', () => {
    expect(chooseSlFromEntry('123.45', 10)).toBe(123.45);
    expect(chooseSlFromEntry(200, 10)).toBe(200);
  });

  test('chooseSlFromEntry falls back to provided fallback when entry invalid', () => {
    expect(chooseSlFromEntry(undefined, 10)).toBe(10);
    expect(chooseSlFromEntry('abc', 5)).toBe(5);
    expect(chooseSlFromEntry(undefined, 7)).toBe(7);
  });
});
