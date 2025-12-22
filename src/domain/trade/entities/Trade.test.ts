import { Trade } from './Trade'

describe('Trade entity', () => {
  test('constructs with valid data', () => {
    const t = new Trade('AAPL', '2025-12-22T10:00', 1, 150.5, 'note')
    expect(t.symbol).toBe('AAPL')
    expect(t.size).toBe(1)
    expect(t.price).toBe(150.5)
  })

  test('throws when symbol is missing', () => {
    expect(() => new Trade('', '2025-12-22T10:00', 1, 100)).toThrow('Symbol required')
  })

  test('throws when entryDate is missing', () => {
    expect(() => new Trade('AAPL', '', 1, 100)).toThrow('Entry date required')
  })

  test('throws for non-positive size', () => {
    expect(() => new Trade('AAPL', '2025-12-22T10:00', 0, 100)).toThrow('Size must be positive')
  })

  test('throws for non-positive price', () => {
    expect(() => new Trade('AAPL', '2025-12-22T10:00', 1, 0)).toThrow('Price must be positive')
  })
})
