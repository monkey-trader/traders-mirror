import { describe, it, expect } from 'vitest';
import { EntryDate } from './EntryDate';
import { EntryDateInvalidError } from '@/domain/analysis/errors/EntryDateInvalidError';

describe('EntryDate VO', () => {
  it('parses ISO string', () => {
    const iso = '2020-01-01T12:34:56.000Z';
    const ed = new EntryDate(iso);
    expect(ed.iso).toBe(new Date(iso).toISOString());
  });

  it('parses datetime-local and converts to ISO', () => {
    // create local datetime string from current date
    const d = new Date('2020-01-01T10:00:00');
    const pad = (n: number) => String(n).padStart(2, '0');
    const localStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
    const ed = new EntryDate(localStr);
    expect(ed.iso).toBe(new Date(localStr).toISOString());
  });

  it('toInputValue returns datetime-local string', () => {
    const iso = '2020-01-01T12:34:00.000Z';
    const ed = new EntryDate(iso);
    expect(ed.toInputValue()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it('throws on invalid input', () => {
    expect(() => new EntryDate('not-a-date')).toThrow(EntryDateInvalidError);
  });
});
