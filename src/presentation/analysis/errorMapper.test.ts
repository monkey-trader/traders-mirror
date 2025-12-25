import { describe, it, expect } from 'vitest'
import { mapAnalysisError } from './errorMapper'

describe('analysis errorMapper', () => {
  it('maps validation-like error', () => {
    const err = { field: 'price', message: 'invalid' }
    const mapped = mapAnalysisError(err)
    expect((mapped as any).field).toBe('price')
  })

  it('maps unknown error to generic message', () => {
    const mapped = mapAnalysisError(new Error('boom'))
    expect((mapped as any).message).toBeDefined()
  })
})

