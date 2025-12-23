import { describe, test, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import {
  SizeMustBePositiveError,
} from '@/domain/trade/errors/DomainErrors'

// Mock the DI container so the component uses our mocked service
vi.mock('@/shared/di', () => {
  const mockService = {
    listTrades: vi.fn().mockResolvedValue([]),
    addTrade: vi.fn().mockRejectedValue(new SizeMustBePositiveError()),
  }
  return {
    default: {
      tradeService: mockService,
      tradeRepository: {},
    },
  }
})

import container from '@/shared/di'
import { TradeJournal } from './TradeJournal'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TradeJournal error handling and flows', () => {
  test('shows field-level error when service throws a domain error (Size must be positive)', async () => {
    vi.mocked(container.tradeService.listTrades).mockResolvedValueOnce([])
    vi.mocked(container.tradeService.addTrade).mockRejectedValueOnce(new SizeMustBePositiveError())

    const { container: dom } = render(<TradeJournal />)

    // fill form with values that pass client-side validation but domain VO will throw
    const symbol = screen.getByPlaceholderText('Symbol') as HTMLInputElement
    const datetime = dom.querySelector('input[type="datetime-local"]') as HTMLInputElement
    const size = screen.getByPlaceholderText('Size') as HTMLInputElement
    const price = screen.getByPlaceholderText('Price') as HTMLInputElement

    fireEvent.change(symbol, { target: { value: 'AAPL' } })
    if (datetime) fireEvent.change(datetime, { target: { value: '2025-12-22T10:00' } })
    // use a valid size for client-side but service will reject
    fireEvent.change(size, { target: { value: '1' } })
    fireEvent.change(price, { target: { value: '100' } })

    fireEvent.click(screen.getByRole('button', { name: /Add Trade/i }))

    // Expect field-level error for size to appear and be referenced by aria-describedby
    const sizeError = await screen.findByRole('alert')
    expect(sizeError).toBeTruthy()
    expect(sizeError.textContent).toContain('Size must be positive')

    // ensure the size input references the error element
    const sizeInput = screen.getByPlaceholderText('Size')
    const described = sizeInput.getAttribute('aria-describedby')
    expect(described).toBe('size-error')
  })

  test('success flow: trade is added and appears in the list', async () => {
    // initial list empty
    vi.mocked(container.tradeService.listTrades).mockResolvedValueOnce([])
    // make addTrade succeed
    vi.mocked(container.tradeService.addTrade).mockResolvedValueOnce(undefined)
    // after adding, listTrades returns the added trade
    const added = { symbol: 'AAPL', entryDate: '2025-12-22T10:00', size: 1, price: 100, notes: 'ok', status: 'OPEN' }
    vi.mocked(container.tradeService.listTrades).mockResolvedValueOnce([added])

    const { container: dom } = render(<TradeJournal />)

    const symbol = screen.getByPlaceholderText('Symbol') as HTMLInputElement
    const datetime = dom.querySelector('input[type="datetime-local"]') as HTMLInputElement
    const size = screen.getByPlaceholderText('Size') as HTMLInputElement
    const price = screen.getByPlaceholderText('Price') as HTMLInputElement

    fireEvent.change(symbol, { target: { value: 'AAPL' } })
    if (datetime) fireEvent.change(datetime, { target: { value: '2025-12-22T10:00' } })
    fireEvent.change(size, { target: { value: '1' } })
    fireEvent.change(price, { target: { value: '100' } })

    fireEvent.click(screen.getByRole('button', { name: /Add Trade/i }))


    // The trade row should appear
    const cell = await screen.findByText('AAPL')
    expect(cell).toBeTruthy()
  })

  test('shows field error for invalid entry date and does not call service', async () => {
    vi.mocked(container.tradeService.listTrades).mockResolvedValueOnce([])
    vi.mocked(container.tradeService.addTrade).mockResolvedValueOnce(undefined)

    const { container: dom } = render(<TradeJournal />)

    const symbol = screen.getByPlaceholderText('Symbol') as HTMLInputElement
    const datetime = dom.querySelector('input[type="datetime-local"]') as HTMLInputElement
    const size = screen.getByPlaceholderText('Size') as HTMLInputElement
    const price = screen.getByPlaceholderText('Price') as HTMLInputElement

    fireEvent.change(symbol, { target: { value: 'AAPL' } })
    // set invalid date string; datetime-local in JSDOM will likely normalize to empty which triggers 'Entry date required'
    if (datetime) fireEvent.change(datetime, { target: { value: 'invalid-date' } })
    fireEvent.change(size, { target: { value: '1' } })
    fireEvent.change(price, { target: { value: '100' } })

    fireEvent.click(screen.getByRole('button', { name: /Add Trade/i }))

    // field-level error should appear for entryDate
    const entryError = await screen.findByText((content) => content.includes('Entry date required') || content.includes('Invalid date'))
    expect(entryError).toBeTruthy()
    // service.addTrade should not have been called
    expect(vi.mocked(container.tradeService.addTrade)).not.toHaveBeenCalled()
  })
})
