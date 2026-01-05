import { describe, it, expect } from 'vitest';
import Status from '@/domain/trade/valueObjects/Status';
import { StatusInvalidError } from '@/domain/trade/errors/StatusInvalidError';

describe('Status VO', () => {
  it('defaults to OPEN', () => {
    const s = new Status();
    expect(s.value).toBe('OPEN');
  });

  it('accepts lowercase and normalizes', () => {
    expect(new Status('closed').value).toBe('CLOSED');
    expect(new Status('filled').value).toBe('FILLED');
  });

  it('throws on invalid input', () => {
    expect(() => new Status('bad')).toThrow(StatusInvalidError);
  });
  it('fromInputValue and toInputValue work', () => {
    const s = Status.fromInputValue('closed');
    expect(s.toInputValue()).toBe('CLOSED');
  });
});
