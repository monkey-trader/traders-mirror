import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { TradeJournal } from './TradeJournal';

// Tests to exercise code paths when no repo is injected (local fallback)

describe('TradeJournal without repo (local fallback)', () => {
  it('adds a new trade locally when no repo is provided', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<TradeJournal />);
    });

    const sym = 'LOCALADD';
    // fill minimal required fields in the NewTradeForm inline using userEvent for realistic behavior
    const symbolInput = screen.getByLabelText(/Symbol/i);
    const priceInput = screen.getByLabelText(/Entry Price/i);
    const sizeInput = screen.getByLabelText(/Position Size/i);
    const marginInput = screen.getByLabelText(/Margin/i, { selector: 'input' });
    const leverageInput = screen.getByLabelText(/Leverage/i, { selector: 'input' });
    const slInput = screen.getByLabelText(/Stop Loss/i);

    await user.clear(symbolInput);
    await user.type(symbolInput, sym);
    await user.clear(priceInput);
    await user.type(priceInput, '1.234');
    await user.clear(sizeInput);
    await user.type(sizeInput, '1000');
    await user.clear(marginInput);
    await user.type(marginInput, '10');
    await user.clear(leverageInput);
    await user.type(leverageInput, '1');
    await user.clear(slInput);
    await user.type(slInput, '1.2');

    // Verify form values were updated
    expect((symbolInput as HTMLInputElement).value).toBe(sym);

    // Wait for React to flush all state updates
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Submit the form directly (more reliable than button click in happy-dom)
    const form = document.querySelector('form') as HTMLFormElement;
    expect(form).toBeTruthy();
    await act(async () => {
      fireEvent.submit(form);
    });

    // Give time for async handleAdd to complete
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    // The new symbol should appear in the trade list
    await waitFor(() => expect(screen.getByText(sym)).toBeTruthy(), { timeout: 3000 });
  });

  it('loads mock data via modal when repo is not available', async () => {
    render(<TradeJournal />);

    // open mock loader (button visible by default via settings)
    const loadBtn = screen.getByRole('button', { name: /Load mock data/i });
    fireEvent.click(loadBtn);

    // In the modal click the modal's Load button (scope to dialog to avoid matching top-level "Load mock data")
    const dialog = await screen.findByRole('dialog');
    const loadModalBtn = within(dialog).getByRole('button', { name: /^Load$/i });
    fireEvent.click(loadModalBtn);

    // After loading, default mock trade ETHUSD from DEFAULT_MOCK_TRADES should be visible
    await waitFor(() => expect(screen.getAllByText(/ETHUSD/i).length).toBeGreaterThan(0));
  });
});
