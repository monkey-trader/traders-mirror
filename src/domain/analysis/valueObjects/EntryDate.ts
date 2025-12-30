import { EntryDateInvalidError } from '@/domain/analysis/errors/EntryDateInvalidError';

export class EntryDate {
  public readonly iso: string;

  constructor(input: unknown) {
    if (input instanceof Date) {
      if (isNaN(input.getTime())) throw new EntryDateInvalidError('Invalid Date object');
      this.iso = input.toISOString();
      return;
    }

    if (typeof input !== 'string')
      throw new EntryDateInvalidError('EntryDate must be a string or Date');

    // try to parse as ISO or datetime-local
    let date: Date | null = null;

    // if matches datetime-local yyyy-MM-ddTHH:mm(:ss)?
    const datetimeLocalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;
    if (datetimeLocalRegex.test(input)) {
      // treat as local time, convert to UTC ISO
      const local = new Date(input);
      if (!isNaN(local.getTime())) {
        date = local;
      }
    }

    // try ISO
    if (!date) {
      const parsed = new Date(input);
      if (!isNaN(parsed.getTime())) date = parsed;
    }

    if (!date) throw new EntryDateInvalidError('Cannot parse entry date');

    this.iso = date.toISOString();
  }

  toInputValue(): string {
    // convert ISO to local datetime-local value: yyyy-MM-ddTHH:mm
    const d = new Date(this.iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  }

  static fromInputValue(input: string): string {
    const ed = new EntryDate(input);
    return ed.iso;
  }
}
