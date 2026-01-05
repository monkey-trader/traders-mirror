import { NotesTooLongError } from '@/domain/trade/errors/NotesTooLongError';

export class Notes {
  readonly value: string;
  static readonly MAX_LENGTH = 1000;

  constructor(input?: string) {
    const v = (input ?? '').trim();
    if (v.length > Notes.MAX_LENGTH) throw new NotesTooLongError(Notes.MAX_LENGTH);
    this.value = v;
  }

  static fromInputValue(s?: string) {
    return new Notes(s);
  }

  toInputValue(): string {
    return this.value;
  }

  isEmpty(): boolean {
    return this.value === '';
  }
}

export default Notes;
