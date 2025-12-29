export class EntryDate {
  public readonly value: string;
  constructor(date: string) {
    if (!date || isNaN(Date.parse(date))) throw new EntryDateInvalidError(date);
    this.value = new Date(date).toISOString();
  }

  // Return a string suitable for <input type="datetime-local"> from an ISO date or now
  static toInputValue(iso?: string): string {
    const d = iso ? new Date(iso) : new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  // Parse a datetime-local input value (e.g. "2025-12-26T14:30") to ISO string
  // Throws if invalid
  static fromInputValue(input: string): string {
    if (!input || isNaN(Date.parse(input))) throw new EntryDateInvalidError(input);
    return new Date(input).toISOString();
  }
}

export class EntryDateInvalidError extends Error {
  constructor(date: unknown) {
    super(`Entry date invalid: ${date}`);
    this.name = 'EntryDateInvalidError';
  }
}
