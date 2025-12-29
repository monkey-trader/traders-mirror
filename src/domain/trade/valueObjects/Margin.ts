import { DomainError } from '../errors/DomainError';

export class MarginMustBePositiveError extends DomainError {
  constructor(value: number) {
    super(`Margin must be positive, got: ${value}`);
  }
}

export class Margin {
  public readonly value: number;

  constructor(input: number) {
    if (isNaN(input)) {
      throw new MarginMustBePositiveError(input);
    }
    if (input <= 0) {
      throw new MarginMustBePositiveError(input);
    }
    this.value = input;
  }
}
