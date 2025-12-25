import { describe, it, expect } from 'vitest'
import { Leverage } from './Leverage'

describe('Leverage VO', () => {
  it('accepts empty and values', () => {
    expect(new Leverage().value).toBe('')
    expect(new Leverage('10x').value).toBe('10x')
  })

  it('throws on invalid empty string after trimming', () => {
    expect(() => new Leverage('   ')).toThrow()
  })
})

