import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TradeJournal } from './TradeJournal';

// Tests to exercise code paths when no repo is injected (local fallback)

describe('TradeJournal without repo (local fallback)', () => {
  it('adds a new trade locally when no repo is provided', async () => {
    render(<TradeJournal />);

    const sym = 'LOCALADD';
    // fill minimal required fields in the NewTradeForm inline
    fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: sym } });
    fireEvent.change(screen.getByLabelText(/Entry Price/i), { target: { value: '1.234' } });
    fireEvent.change(screen.getByLabelText(/Position Size/i), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText(/Margin/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/Leverage/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '1.2' } });

    fireEvent.click(screen.getByRole('button', { name: /Add/i }));

    // The new symbol should appear in the trade list
    await waitFor(() => expect(screen.getByText(sym)).toBeTruthy());
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
