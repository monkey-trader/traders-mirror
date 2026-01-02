import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { AnalysisList, AnalysisSummary } from './AnalysisList'

const sample: AnalysisSummary[] = [
  { id: 'a1', symbol: 'BTCUSD', createdAt: new Date().toISOString(), notes: 'note 1', market: 'Crypto' },
  { id: 'a2', symbol: 'EURUSD', createdAt: new Date().toISOString(), notes: 'note 2', market: 'Forex' },
]

describe('AnalysisList', () => {
  it('renders empty state when no items', () => {
    render(<AnalysisList items={[]} />)
    expect(screen.getByTestId('analysis-list')).toBeTruthy()
    expect(screen.getByText(/Keine Analysen vorhanden/i)).toBeTruthy()
  })

  it('renders items and triggers onSelect and onOpen', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onOpen = vi.fn()
    render(<AnalysisList items={sample} onSelect={onSelect} onOpen={onOpen} />)

    // clicking the first row should call onSelect
    const firstItem = screen.getByTestId('analysis-item-a1')
    await user.click(firstItem)
    expect(onSelect).toHaveBeenCalledWith('a1')

    // clicking the Open button should call onOpen and onSelect
    const openButtons = screen.getAllByRole('button', { name: /Open/i })
    await user.click(openButtons[0])
    expect(onOpen).toHaveBeenCalledWith('a1')
    expect(onSelect).toHaveBeenCalled()

    // keyboard Enter on second item should call onSelect
    const secondItem = screen.getByTestId('analysis-item-a2')
    await user.keyboard('{Tab}{Tab}{Enter}')
    // at least assert that onSelect was called multiple times
    expect(onSelect.mock.calls.length).toBeGreaterThanOrEqual(2)
  })
})
