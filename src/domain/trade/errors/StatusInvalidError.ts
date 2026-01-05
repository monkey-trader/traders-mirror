export class StatusInvalidError extends Error {
  constructor(value?: string) {
    super(`Invalid status: ${value}`);
    this.name = 'StatusInvalidError';
  }
}
