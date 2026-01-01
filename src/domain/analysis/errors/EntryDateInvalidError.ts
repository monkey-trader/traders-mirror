export class EntryDateInvalidError extends Error {
  constructor(message = 'Entry date is invalid') {
    super(message);
    this.name = 'EntryDateInvalidError';
  }
}
