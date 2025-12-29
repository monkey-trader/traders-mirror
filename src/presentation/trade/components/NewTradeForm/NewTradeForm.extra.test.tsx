import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import { NewTradeForm } from './NewTradeForm';
import type { NewTradeFormState } from './NewTradeForm';
import type { MarketValue } from '@/presentation/shared/components/MarketSelect/MarketSelect';

const baseForm: NewTradeFormState = {
  symbol: '',
  entryDate: '2025-12-29T12:00',
  size: undefined,
  price: undefined,
  side: 'LONG',
  status: 'OPEN',
  notes: '',
  sl: undefined,
  tp1: undefined,
  tp2: undefined,
  tp3: undefined,
  tp4: undefined,
  leverage: undefined,
  margin: undefined,
  market: '' as MarketValue,
};

describe('NewTradeForm extra coverage', () => {
  it('shows debug block when debugUiEnabled and errors present', () => {
    const onChangeForm = vi.fn();
    const onBlurField = vi.fn();
    const onSubmit = vi.fn();
    const onReset = vi.fn();
    const setMarketFilter = vi.fn();

    const errors = { symbol: 'Required', market: 'Market required' };

    render(
      <NewTradeForm
        form={baseForm}
        formErrors={errors}
        touched={{}}
        formSubmitted={true}
        formKey={1}
        debugUiEnabled={true}
        lastStatus={'ERR!'}
        onChangeForm={onChangeForm}
        onBlurField={onBlurField}
        onSubmit={onSubmit}
        onReset={onReset}
        setMarketFilter={setMarketFilter}
      />
    );

    // debug block should show Status and Form errors
    expect(screen.getByText(/Status:/i)).toBeTruthy();
    expect(screen.getByText(/Form errors:/i)).toBeTruthy();
    // specific error entries
    expect(screen.getByText(/symbol: Required/i)).toBeTruthy();
    expect(screen.getByText(/market: Market required/i)).toBeTruthy();
  });

  it('calls setMarketFilter and onChangeForm when MarketSelect clicked', () => {
    const onChangeForm = vi.fn();
    const onBlurField = vi.fn();
    const onSubmit = vi.fn();
    const onReset = vi.fn();
    const setMarketFilter = vi.fn();

    render(
      <NewTradeForm
        form={baseForm}
        formErrors={{}}
        touched={{}}
        formSubmitted={false}
        formKey={2}
        debugUiEnabled={false}
        onChangeForm={onChangeForm}
        onBlurField={onBlurField}
        onSubmit={onSubmit}
        onReset={onReset}
        setMarketFilter={setMarketFilter}
      />
    );

    // MarketSelect renders button "Forex" and "Crypto" in compact mode - select by visible text
    const forexBtn = screen.getByText(/Forex/i);
    fireEvent.click(forexBtn);

    // Clicking should have called onChangeForm (market updated) and setMarketFilter
    expect(onChangeForm).toHaveBeenCalled();
    expect(setMarketFilter).toHaveBeenCalled();
  });
});
