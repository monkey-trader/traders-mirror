import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TradeJournal } from './TradeJournal';
import InMemoryTradeRepository from '@/infrastructure/trade/repositories/InMemoryTradeRepository';

// Force compact mode by using forceCompact prop
describe('TradeJournal compact inline editing', () => {
  it('allows editing metrics inline without detail screen', async () => {
    const repo = new InMemoryTradeRepository();
    render(<TradeJournal repo={repo} forceCompact />);
    await screen.findByText(/Trading Journal/i);

    // Wait for PositionCard symbols to render (compact view uses PositionCard)
    const symbols = await screen.findAllByText(/USD$/, {}, { timeout: 1000 });
    expect(symbols.length).toBeGreaterThan(0);

    // Click the first PositionCard's expand button to select that trade (PositionCard exposes expand button)
    const expandBtns = await screen.findAllByLabelText(/Toggle details for/i);
    expect(expandBtns.length).toBeGreaterThan(0);
    const expandBtn = expandBtns[0];
    fireEvent.click(expandBtn);

    const tradeCard = expandBtn.closest('[role="group"]') as HTMLElement | null;
    expect(tradeCard).not.toBeNull();
    const compactItem = tradeCard?.parentElement?.parentElement as HTMLElement | null;
    expect(compactItem).not.toBeNull();

    // Wait for inline metric buttons (e.g., Entry) and trigger editor mode scoped to the same trade
    const entryButton = await within(compactItem as HTMLElement).findByRole('button', {
      name: /Edit Entry/i,
    });
    fireEvent.click(entryButton);

    const entryInput = await screen.findByLabelText(/Entry editor for/i);
    expect(entryInput).toBeInTheDocument();
  });
});
