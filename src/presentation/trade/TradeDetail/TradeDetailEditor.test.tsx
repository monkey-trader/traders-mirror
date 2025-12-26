import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { TradeDetailEditor } from './TradeDetailEditor'

const sample = {
  id: 't1',
  symbol: 'ETHUSD',
  entryDate: '2025-12-21T10:12:00Z',
  size: 0.51,
  price: 1800.5,
  side: 'SHORT',
  notes: 'Scalp-Short nach Fehlausbruch.'
}

describe('TradeDetailEditor', () => {
  it('calls onSave with updated trade when Save now clicked', async () => {
    const onSave = vi.fn(() => Promise.resolve())
    render(<TradeDetailEditor trade={sample as any} onSave={onSave} />)

    // change price
    const priceInput = screen.getByLabelText('Price') as HTMLInputElement
    fireEvent.change(priceInput, { target: { value: '1900.5' } })

    // Save button should be enabled
    const saveButton = screen.getByRole('button', { name: /Save now/i }) as HTMLButtonElement
    expect(saveButton.disabled).toBe(false)

    // click save
    fireEvent.click(saveButton)

    // onSave called with updated price (wait for async handler)
    await waitFor(() => {
      expect(onSave).toHaveBeenCalled()
    })
    // read mock call args using `any` cast to avoid TS mismatches in build
    const calledWith = (onSave as any).mock?.calls?.[0]?.[0]
    expect(calledWith.price).toBe(1900.5)
  })
})
