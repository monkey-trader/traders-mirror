import { describe, it, expect } from 'vitest';
import Notes from '@/domain/trade/valueObjects/Notes';
import { NotesTooLongError } from '@/domain/trade/errors/NotesTooLongError';

describe('Notes Value Object', () => {
  it('constructs empty when undefined', () => {
    const n = new Notes();
    expect(n.value).toBe('');
    expect(n.isEmpty()).toBe(true);
  });

  it('trims input', () => {
    const n = new Notes('  hello world  ');
    expect(n.value).toBe('hello world');
    expect(n.isEmpty()).toBe(false);
  });

  it('throws when too long', () => {
    const long = 'a'.repeat(Notes.MAX_LENGTH + 1);
    expect(() => new Notes(long)).toThrow(NotesTooLongError);
  });

  it('toInputValue returns raw string', () => {
    const n = new Notes('note');
    expect(n.toInputValue()).toBe('note');
  });
});
