import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, vi, expect } from 'vitest'
import { NewTradeForm } from './NewTradeForm'

const baseForm = {
  symbol: '', entryDate: '2025-12-28T12:00', size: undefined, price: undefined, side: 'LONG' as const, status: 'OPEN' as const, notes: '', sl: undefined, tp1: undefined, tp2: undefined, tp3: undefined, tp4: undefined, leverage: undefined, margin: undefined, market: '' as any
}

describe('NewTradeForm', () => {
  it('calls onChangeForm when inputs change and onSubmit when submitted', () => {
    const onChangeForm = vi.fn()
    const onBlurField = vi.fn()
    const onSubmit = vi.fn((e) => e && e.preventDefault())
    const onReset = vi.fn()
    const setMarketFilter = vi.fn()

    render(
      <NewTradeForm
        form={baseForm}
        formErrors={{}}
        touched={{}}
        formSubmitted={false}
        formKey={1}
        debugUiEnabled={false}
        onChangeForm={onChangeForm}
        onBlurField={onBlurField}
        onSubmit={onSubmit}
        onReset={onReset}
        setMarketFilter={setMarketFilter}
      />
    )

    // symbol input
    const symbol = screen.getByLabelText('Symbol') as HTMLInputElement
    fireEvent.change(symbol, { target: { value: 'BTC' } })
    expect(onChangeForm).toHaveBeenCalled()

    // price input
    const price = screen.getByLabelText('Entry Price *') as HTMLInputElement
    fireEvent.change(price, { target: { value: '123.45' } })
    expect(onChangeForm).toHaveBeenCalled()

    // submit by clicking Add
    fireEvent.click(screen.getByText('Add'))
    expect(onSubmit).toHaveBeenCalled()
  })

  it('displays errors when provided and setMarketFilter is called when market changes', () => {
    const onChangeForm = vi.fn()
    const onBlurField = vi.fn()
    const onSubmit = vi.fn((e) => e && e.preventDefault())
    const onReset = vi.fn()
    const setMarketFilter = vi.fn()

    render(
      <NewTradeForm
        form={{ ...baseForm, market: '' }}
        formErrors={{ symbol: 'Required', market: 'Market required' }}
        touched={{ symbol: true, market: true }}
        formSubmitted={true}
        formKey={2}
        debugUiEnabled={true}
        lastStatus={"ERR"}
        onChangeForm={onChangeForm}
        onBlurField={onBlurField}
        onSubmit={onSubmit}
        onReset={onReset}
        setMarketFilter={setMarketFilter}
      />
    )

    // debug section should contain status and errors text
    expect(screen.getByText(/Status:/)).toBeDefined()
    expect(screen.getByText(/Form errors:/)).toBeDefined()

    // click an available market button (MarketSelect renders 'Forex' and 'Crypto' in this compact view)
    const marketBtn = screen.getByText('Forex')
    fireEvent.click(marketBtn)
    expect(setMarketFilter).toHaveBeenCalled()
  })
})
