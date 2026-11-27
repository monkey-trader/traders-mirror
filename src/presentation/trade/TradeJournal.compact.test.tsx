import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TradeJournal } from './TradeJournal';
import InMemoryTradeRepository from '@/infrastructure/trade/repositories/InMemoryTradeRepository';

// Force compact mode by using forceCompact prop
describe('TradeJournal compact editor toggle', () => {
  it('opens compact editor after selecting a trade and allows hiding it again', async () => {
    const repo = new InMemoryTradeRepository();
    render(<TradeJournal repo={repo} forceCompact />);
    await screen.findByText(/Trading Journal/i);

    const cards = await screen.findAllByLabelText(/^Select /i);
    expect(cards.length).toBeGreaterThan(0);
    fireEvent.click(cards[0]);

    const save = await screen.findByRole('button', { name: /save now/i });
    expect(save).toBeDefined();

    const hide = await screen.findByRole('button', { name: /hide details/i });
    fireEvent.click(hide);

    expect(screen.queryByRole('button', { name: /save now/i })).toBeNull();
  });
});
