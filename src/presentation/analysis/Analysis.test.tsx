import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { vi } from 'vitest'

// Mock the LocalStorageAnalysisRepository used by the component
vi.mock('@/infrastructure/analysis/repositories/LocalStorageAnalysisRepository', () => {
  class LocalStorageAnalysisRepository {
    constructor() {
      // keep internal list so delete/listAll behave realistically
      this._items = [
        { id: 'a1', symbol: 'BTCUSD', createdAt: '2025-12-01T00:00:00Z', notes: 'Note A', market: 'Crypto' },
        { id: 'a2', symbol: 'EURUSD', createdAt: '2025-12-02T00:00:00Z', notes: 'Note B', market: 'Forex' },
      ]
    }
    async listAll() {
      return [...this._items]
    }
    async getById(id: string) {
      return this._items.find((i) => i.id === id) || null
    }
    async delete(id: string) {
      this._items = this._items.filter((i) => i.id !== id)
    }
  }
  return { LocalStorageAnalysisRepository }
})

// Provide a lightweight mock for DetailLoader dynamic import used inside Analysis
vi.mock('@/presentation/analysis/AnalysisDetail', () => ({
  // mock should accept the real "analysis" prop used by DetailLoader
  AnalysisDetail: ({ analysis, onRequestDelete }: { analysis: any; onRequestDelete: (id: string) => void }) => (
    <div data-testid="detail">
      <div>Detail for {analysis?.id}</div>
      <button onClick={() => onRequestDelete(analysis?.id)}>Request Delete</button>
    </div>
  ),
}))

import { Analysis } from './Analysis'

describe('Analysis component', () => {
  it('renders list and no-selection state', async () => {
    render(<Analysis />)

    // title
    expect(screen.getByText(/Marktanalyse/i)).toBeInTheDocument()

    // list items should appear after async load
    await waitFor(() => {
      expect(screen.getByText('BTCUSD')).toBeInTheDocument()
      expect(screen.getByText('EURUSD')).toBeInTheDocument()
    })

    // no selection panel should be visible initially
    expect(screen.getByText(/Keine Analyse ausgewählt/i)).toBeInTheDocument()
  })

  it('opens detail when selecting via event and can request delete', async () => {
    render(<Analysis />)

    // wait for list
    await waitFor(() => expect(screen.getByText('BTCUSD')).toBeInTheDocument())

    // dispatch open-analysis event to select an item
    // use id 'a1' which exists in the mocked repo
    const evt = new CustomEvent('open-analysis', { detail: { id: 'a1' } })
    globalThis.dispatchEvent(evt)

    // detail loader (mock) should show up
    await waitFor(() => expect(screen.getByTestId('detail')).toBeInTheDocument())

    // clicking the Request Delete button should open the confirm dialog
    fireEvent.click(screen.getByText('Request Delete'))

    // confirm dialog shows Delete analysis
    await waitFor(() => expect(screen.getByText(/Delete analysis/i)).toBeInTheDocument())

    // click the Delete button inside ConfirmDialog (scoped to dialog to avoid matching 'Request Delete')
    const dialog = screen.getByRole('dialog')
    const delButton = within(dialog).getByRole('button', { name: /Delete/i })
    fireEvent.click(delButton)

    // after deletion the no-selection text should reappear (selected cleared)
    await waitFor(() => expect(screen.getByText(/Keine Analyse ausgewählt/i)).toBeInTheDocument())
  })
})

