export class NotesTooLongError extends Error {
  constructor(max = 1000) {
    super(`Notes must not exceed ${max} characters`);
    this.name = 'NotesTooLongError';
  }
}
