import { describe, it, expect } from 'vitest';
import { mapTradeError } from './errorMapper';

describe('mapTradeError', () => {
  it('maps field error objects', () => {
    const err = { field: 'market', message: 'Bitte Markt auswählen' };
    const mapped = mapTradeError(err);
    expect(mapped).toEqual({ field: 'market', message: 'Bitte Markt auswählen' });
  });

  it('returns default message for unknown errors', () => {
    const mapped = mapTradeError(new Error('boom'));
    expect(mapped).toEqual({ message: 'Unbekannter Fehler beim Erstellen des Trades' });
  });

  it('returns default message for null', () => {
    const mapped = mapTradeError(null);
    expect(mapped).toEqual({ message: 'Unbekannter Fehler beim Erstellen des Trades' });
  });

  it('returns default message for object missing field/message', () => {
    const mapped = mapTradeError({ foo: 1 });
    expect(mapped).toEqual({ message: 'Unbekannter Fehler beim Erstellen des Trades' });
  });

  it('returns default message for wrong types', () => {
    const mapped = mapTradeError({ field: 123, message: {} });
    expect(mapped).toEqual({ message: 'Unbekannter Fehler beim Erstellen des Trades' });
  });
});
