import { describe, it, expect } from 'vitest'
import { mapTradeError } from './errorMapper'

describe('mapTradeError', () => {
  it('maps field error objects', () => {
    const err = { field: 'market', message: 'Bitte Markt auswählen' }
    const mapped = mapTradeError(err)
    expect((mapped as any).field).toBe('market')
    expect((mapped as any).message).toBe('Bitte Markt auswählen')
  })

  it('returns default message for unknown errors', () => {
    const mapped = mapTradeError(new Error('boom'))
    expect((mapped as any).message).toBe('Unbekannter Fehler beim Erstellen des Trades')
  })
})

