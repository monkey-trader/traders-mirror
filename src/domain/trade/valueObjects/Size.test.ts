import { describe, it, expect } from 'vitest'
import { Size, SizeMustBePositiveError } from './Size'

describe('Size VO', () => {
  it('accepts positive sizes', () => {
    const s = new Size(1)
    expect(s).toBeInstanceOf(Size)
    expect(s.value).toBe(1)
  })

  it('throws SizeMustBePositiveError for zero', () => {
    expect(() => new Size(0)).toThrow(SizeMustBePositiveError)
  })

  it('throws SizeMustBePositiveError for non-number inputs', () => {
    expect(() => new Size(undefined as any)).toThrow(SizeMustBePositiveError)
  })
})
