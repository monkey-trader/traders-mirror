import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import { ConfluenceWizard } from './ConfluenceWizard';

describe('ConfluenceWizard', () => {
  it('allows selecting multiple timeframes and returns aggregated selections on finish', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(<ConfluenceWizard onConfirm={onConfirm} onCancel={onCancel} />);

    // select Monthly, pick 'Liquidität cluster' and save
    fireEvent.click(screen.getByText('Monthly'));
    const liq = screen.getByLabelText('Liquidität cluster');
    fireEvent.click(liq);
    fireEvent.click(screen.getByText('Speichern'));

    // select Weekly, pick '50 EMA' and save
    fireEvent.click(screen.getByText('Weekly'));
    const ema = screen.getByLabelText('50 EMA');
    fireEvent.click(ema);
    fireEvent.click(screen.getByText('Speichern'));

    // finish the wizard
    fireEvent.click(screen.getByText('Fertig'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    const payload = onConfirm.mock.calls[0][0];
    expect(payload).toBeTruthy();
    expect(payload.selections).toBeTruthy();
    expect(payload.selections.Monthly).toBeTruthy();
    expect(payload.selections.Weekly).toBeTruthy();
    expect(payload.selections.Monthly.confluence['Liquidität cluster']).toBe(true);
    expect(payload.selections.Weekly.confluence['50 EMA']).toBe(true);
  });
});
