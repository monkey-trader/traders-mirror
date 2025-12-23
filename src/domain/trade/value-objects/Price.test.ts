import { describe, test, expect } from 'vitest'
import { Price } from './Price'

describe('Price VO', () => {
  test('accepts positive number', () => {
    const p = new Price(123.45)
    expect(p.toNumber()).toBe(123.45)
  })

  test('throws for non-number', () => {
    expect(() => new Price(NaN)).toThrow('Price must be a number')
  })

  test('throws for non-positive', () => {
    expect(() => new Price(0)).toThrow('Price must be positive')
  })
})

