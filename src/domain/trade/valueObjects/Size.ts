export class Size {
  public readonly value: number;
  constructor(size: number) {
    if (typeof size !== 'number' || size <= 0) throw new SizeMustBePositiveError(size);
    this.value = size;
  }
}

export class SizeMustBePositiveError extends Error {
  constructor(size: unknown) {
    super(`Size must be positive: ${size}`);
    this.name = 'SizeMustBePositiveError';
  }
}
