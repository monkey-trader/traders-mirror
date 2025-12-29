import { describe, it, expect } from 'vitest';
import { Side, SideInvalidError } from './Side';

describe('Side VO', () => {
  it('accepts "long" and normalizes to LONG', () => {
    const s = new Side('long');
    expect(s.value).toBe('LONG');
  });

  it('accepts "Short" and normalizes to SHORT', () => {
    const s = new Side('Short');
    expect(s.value).toBe('SHORT');
  });

  it('throws SideInvalidError for invalid input', () => {
    expect(() => new Side('weird')).toThrow(SideInvalidError);
  });
});
