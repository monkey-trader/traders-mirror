import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TradeTarget } from '@/domain/trade/value-objects/TradeTarget'

// mock container
vi.mock('@/shared/di', () => {
  const mockTradeService = {
    listTrades: vi.fn().mockResolvedValue([]),
    addTrade: vi.fn(),
  }
  const mockEvaluation = {
    moveStopToBreakEven: vi.fn().mockResolvedValue({ type: 'BreakEvenMoved' }),
    onMarketTick: vi.fn(),
  }
  return { default: { tradeService: mockTradeService, tradeEvaluationService: mockEvaluation } }
})

import container from '@/shared/di'
import { TradeJournal } from './TradeJournal'

describe('TradeJournal BE button', () => {
  it('calls evaluation service and refreshes trades', async () => {
    const sl = new TradeTarget({ id: 'sl1', kind: 'STOP_LOSS', price: 90 })
    const trade = { symbol: 'AAPL', entryDate: '2025-01-01T00:00', size: 1, price: 100, targets: [sl.toPrimitive()], status: 'OPEN' }
    const be = new TradeTarget({ id: 'sl1', kind: 'BREAK_EVEN', price: 100 })

    vi.mocked(container.tradeService.listTrades)
      .mockResolvedValueOnce([trade])
      .mockResolvedValueOnce([{ ...trade, targets: [be.toPrimitive()] }])

    // mock onMarketTick to indicate BE candidate
    vi.mocked(container.tradeEvaluationService.onMarketTick).mockResolvedValueOnce([
      { trade, candidate: { canMoveToBreakEven: true, beThreshold: 120, stopTarget: sl.toPrimitive() } }
    ])

    render(<TradeJournal />)

    const cell = await screen.findByText('AAPL')
    expect(cell).toBeTruthy()

    // run market tick to enable BE badge/button
    const marketInput = screen.getByPlaceholderText('Market Symbol') as HTMLInputElement
    const priceInput = screen.getByPlaceholderText('Market Price') as HTMLInputElement
    const runButton = screen.getByRole('button', { name: /Run Market Tick/i })

    fireEvent.change(marketInput, { target: { value: 'AAPL' } })
    fireEvent.change(priceInput, { target: { value: '120' } })
    fireEvent.click(runButton)

    // BE badge should appear
    const badge = await screen.findByTestId('be-badge-0')
    expect(badge).toBeTruthy()

    const button = await screen.findByRole('button', { name: /Move SL → BE/i })
    fireEvent.click(button)

    // ensure evaluation service called
    expect(vi.mocked(container.tradeEvaluationService.moveStopToBreakEven)).toHaveBeenCalled()

    // after update, the list should refresh (listTrades called again)
    expect(vi.mocked(container.tradeService.listTrades)).toHaveBeenCalled()
  })
})
