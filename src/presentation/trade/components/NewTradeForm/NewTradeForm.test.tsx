import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NewTradeForm } from './NewTradeForm';
import type { NewTradeFormState } from './NewTradeForm';

// Test-scoped shim: ensure jsdom's missing HTMLFormElement.submit doesn't fail when buttons trigger form submit
(HTMLFormElement.prototype as unknown as { submit?: () => void }).submit = function () {
  // no-op for tests
};

const baseForm: NewTradeFormState = {
  symbol: '',
  entryDate: '2025-12-29T12:00',
  size: undefined,
  price: undefined,
  side: 'LONG',
  status: 'OPEN',
  notes: '',
  market: 'Crypto',
};

describe('NewTradeForm', () => {
  it('renders basic form and handles Reset and Add (submit)', () => {
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
        formKey={0}
        debugUiEnabled={false}
        lastStatus={null}
        onChangeForm={onChangeForm}
        onBlurField={onBlurField}
        onSubmit={onSubmit}
        onReset={onReset}
        setMarketFilter={setMarketFilter}
      />
    );

    // header
    expect(screen.getByText(/New Trade/i)).toBeTruthy();

    // Reset button works
    const resetBtn = screen.getByRole('button', { name: /Reset new trade form|Reset/i });
    fireEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalled();

    // Add (submit) button triggers onSubmit
    const addBtn = screen.getByRole('button', { name: /Add/i });
    fireEvent.click(addBtn);
    expect(onSubmit).toHaveBeenCalled();
  });

  it('shows debug UI with status and formErrors', () => {
    const onChangeForm = vi.fn();
    const onBlurField = vi.fn();
    const onSubmit = vi.fn();
    const onReset = vi.fn();
    const setMarketFilter = vi.fn();

    render(
      <NewTradeForm
        form={baseForm}
        formErrors={{ price: 'Entry Price ist erforderlich' }}
        touched={{}}
        formSubmitted={false}
        formKey={0}
        debugUiEnabled={true}
        lastStatus={'validation failed: price'}
        onChangeForm={onChangeForm}
        onBlurField={onBlurField}
        onSubmit={onSubmit}
        onReset={onReset}
        setMarketFilter={setMarketFilter}
      />
    );

    // debug status rendered
    expect(screen.getByText(/Status:/i)).toBeTruthy();
    // error listed
    expect(screen.getByText(/price: Entry Price ist erforderlich/i)).toBeTruthy();
  });

  it('market select calls onChangeForm, onBlurField and setMarketFilter', () => {
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
        formKey={0}
        debugUiEnabled={false}
        lastStatus={null}
        onChangeForm={onChangeForm}
        onBlurField={onBlurField}
        onSubmit={onSubmit}
        onReset={onReset}
        setMarketFilter={setMarketFilter}
      />
    );

    // find the Market button for 'Forex' by visible text (more robust in compact layout)
    const forexBtn = screen.getByText(/Forex/i);
    fireEvent.click(forexBtn);

    expect(onChangeForm).toHaveBeenCalled();
    // first call's arg should include market: 'Forex'
    expect(onChangeForm.mock.calls[0][0].market).toBe('Forex');
    expect(onBlurField).toHaveBeenCalledWith('market');
    expect(setMarketFilter).toHaveBeenCalledWith('Forex');
  });

  it('shows field errors when touched or after submit', () => {
    const onChangeForm = vi.fn();
    const onBlurField = vi.fn();
    const onSubmit = vi.fn();
    const onReset = vi.fn();
    const setMarketFilter = vi.fn();

    render(
      <NewTradeForm
        form={baseForm}
        formErrors={{ price: 'Entry Price ist erforderlich' }}
        touched={{}}
        formSubmitted={true}
        formKey={0}
        debugUiEnabled={false}
        lastStatus={null}
        onChangeForm={onChangeForm}
        onBlurField={onBlurField}
        onSubmit={onSubmit}
        onReset={onReset}
        setMarketFilter={setMarketFilter}
      />
    );

    // price error should be shown because formSubmitted=true
    expect(screen.getByText(/Entry Price ist erforderlich/i)).toBeTruthy();
  });
});
