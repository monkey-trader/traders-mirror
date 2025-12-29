// ValueObject für Side (Long/Short)
export type SideType = 'LONG' | 'SHORT';

export class Side {
  public readonly value: SideType;
  constructor(input: string) {
    const normalized = input.trim().toUpperCase();
    if (normalized !== 'LONG' && normalized !== 'SHORT') {
      throw new SideInvalidError(input);
    }
    this.value = normalized as SideType;
  }
}

export class SideInvalidError extends Error {
  constructor(input: string) {
    super(`Side must be 'LONG' or 'SHORT', got '${input}'`);
    this.name = 'SideInvalidError';
  }
}
