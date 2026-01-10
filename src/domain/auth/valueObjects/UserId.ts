// Value Object: UserId
export class UserId {
  public readonly value: string;
  constructor(input: string) {
    if (!input || typeof input !== 'string' || input.trim().length < 3) {
      throw new UserIdInvalidError(input);
    }
    this.value = input.trim();
  }
}

export class UserIdInvalidError extends Error {
  constructor(input: unknown) {
    super(`Invalid UserId: ${String(input)}`);
    this.name = 'UserIdInvalidError';
  }
}
