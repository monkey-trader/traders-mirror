import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, afterEach, describe, it, expect } from 'vitest'
import { TradeList, type TradeListItem } from './TradeList'

afterEach(() => {
  vi.restoreAllMocks()
})

const sampleTrade = (overrides: Partial<TradeListItem> = {}): TradeListItem => ({
  id: 't1',
  symbol: 'ABCUSD',
  entryDate: '2025-01-01T00:00:00.000Z',
  size: 1,
  price: 1,
  side: 'buy',
  status: 'OPEN',
  ...overrides,
})

describe('TradeList', () => {
  it('renders items and handles click and keyboard select', () => {
    const onSelect = vi.fn()
    render(<TradeList trades={[sampleTrade()]} onSelect={onSelect} />)

    const item = screen.getByLabelText('Select ABCUSD')
    fireEvent.click(item)
    expect(onSelect).toHaveBeenCalledWith('t1')

    // keyboard Enter
    fireEvent.keyDown(item, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('t1')
  })

  it('analysis open button sets hash and dispatches event (sync + async)', async () => {
    const trade = sampleTrade({ analysisId: 'an-123' })
    const onSelect = vi.fn()
    const dispatchSpy = vi.spyOn(globalThis, 'dispatchEvent')

    render(<TradeList trades={[trade]} onSelect={onSelect} />)

    const btn = screen.getByLabelText(`Open analysis for ${trade.symbol}`)
    // ensure initial hash is empty-ish
    globalThis.location.hash = ''
    fireEvent.click(btn)

    // hash should be set synchronously
    expect(globalThis.location.hash).toContain('#/analysis?id=an-123')

    // Wait for event dispatch (setTimeout inside component)
    await waitFor(() => expect(dispatchSpy).toHaveBeenCalled())
    const calledWith = dispatchSpy.mock.calls[0][0]
    expect(calledWith.type).toBe('open-analysis')
    // @ts-ignore - CustomEvent typing
    expect(calledWith.detail?.id).toBe('an-123')
  })

  it('compact view shows TP placeholders and analysis button', () => {
    const trade = sampleTrade({ tp1: undefined, tp2: undefined, tp3: 3, tp4: undefined, analysisId: 'an-x' })
    const onSelect = vi.fn()
    render(<TradeList trades={[trade]} onSelect={onSelect} compactView />)

    // TP1 placeholder
    expect(screen.getByText(/TP1: -/)).toBeTruthy()
    // TP3 should show the number
    expect(screen.getByText(/TP3: 3/)).toBeTruthy()
    // Analysis open button exists
    expect(screen.getByLabelText(`Open analysis for ${trade.symbol}`)).toBeTruthy()
  })

  it('renders LONG and SHORT badges with normalized labels and classes', () => {
    const trades: TradeListItem[] = [
      {
        id: '1',
        symbol: 'BTCUSD',
        entryDate: '2025-01-01T00:00:00Z',
        size: 1,
        price: 10000,
        side: 'LONG',
      },
      {
        id: '2',
        symbol: 'ETHUSD',
        entryDate: '2025-01-02T00:00:00Z',
        size: 2,
        price: 2000,
        side: 'SELL',
      },
    ]

    render(<TradeList trades={trades} onSelect={() => {}} />)

    // Check normalized labels
    expect(screen.getByText('LONG')).toBeDefined()
    expect(screen.getByText('SHORT')).toBeDefined()

    // Check that badge elements exist and have the side class applied
    const longBadge = screen.getByText('LONG').closest('div')
    const shortBadge = screen.getByText('SHORT').closest('div')

    expect(longBadge).toBeDefined()
    expect(shortBadge).toBeDefined()

    // className checks (module CSS transforms to generated names; basic check for substring)
    expect(longBadge?.className).toMatch(/sideLong/)
    expect(shortBadge?.className).toMatch(/sideShort/)
  })

  it('clicking analysis loupe sets hash and dispatches open-analysis (userEvent)', async () => {
    const user = userEvent.setup()
    const withAnalysis: TradeListItem[] = [
      {
        id: 'a1',
        symbol: 'USDCHF',
        entryDate: '2025-01-02T00:00:00Z',
        size: 1,
        price: 1,
        side: 'LONG',
        analysisId: 'analysis-a1',
      },
    ]

    const spy = vi.spyOn(globalThis, 'dispatchEvent')
    render(<TradeList trades={withAnalysis} onSelect={() => {}} />)

    const button = screen.getByRole('button', { name: /Open analysis for USDCHF/i })
    await user.click(button)

    expect(globalThis.location.hash).toContain('#/analysis?id=analysis-a1')
    await waitFor(() => expect(spy).toHaveBeenCalled())
    spy.mockRestore()
  })
})
