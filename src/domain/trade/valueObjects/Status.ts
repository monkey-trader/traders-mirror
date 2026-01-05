import { StatusInvalidError } from '@/domain/trade/errors/StatusInvalidError';

export type StatusValue = 'OPEN' | 'CLOSED' | 'FILLED';

export class Status {
  readonly value: StatusValue;
  static readonly ALLOWED: StatusValue[] = ['OPEN', 'CLOSED', 'FILLED'];

  constructor(input?: string | StatusValue) {
    const v = (input ?? 'OPEN').toString().trim().toUpperCase() as StatusValue;
    if (!Status.ALLOWED.includes(v)) throw new StatusInvalidError(String(input));
    this.value = v;
  }

  static fromInputValue(s?: string) {
    return new Status(s);
  }

  toInputValue(): string {
    return this.value;
  }
}

export default Status;
