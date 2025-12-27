import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TradeJournal } from './TradeJournal'
import InMemoryTradeRepository from '@/infrastructure/trade/repositories/InMemoryTradeRepository'

// Force compact mode by using forceCompact prop
describe('TradeJournal compact editor toggle', () => {
  it('shows compact summary and toggles editor when Show details clicked', async () => {
    const repo = new InMemoryTradeRepository()
    const { container } = render(<TradeJournal repo={repo} forceCompact />)

    // Wait for PositionCard symbols to render (compact view uses PositionCard)
    const symbols = await screen.findAllByText(/USD$/, {}, { timeout: 1000 })
    expect(symbols.length).toBeGreaterThan(0)

    // Click the first symbol element to select that trade (PositionCard renders symbol text)
    fireEvent.click(symbols[0])

    // Now the compact summary should show a Show details button
    const show = await screen.findByRole('button', { name: /show details/i })
    expect(show).toBeDefined()

    // Click to open details
    fireEvent.click(show)

    // Save button in editor should be visible
    const save = await screen.findByRole('button', { name: /save now/i })
    expect(save).toBeDefined()

    // Hide details
    const hide = screen.getByRole('button', { name: /hide details/i })
    fireEvent.click(hide)

    expect(screen.queryByRole('button', { name: /save now/i })).toBeNull()
  })
})
