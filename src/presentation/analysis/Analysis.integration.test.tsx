import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TradeJournal } from '@/presentation/trade/TradeJournal';

// Mock ResizeObserver for jsdom environment used in tests
class FakeResizeObserver {
  callback: unknown;
  constructor(cb: unknown) {
    this.callback = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

// attach to global (vitest/node environment)
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- attach fake to global
(global as any).ResizeObserver = FakeResizeObserver;

describe('Analysis -> prefill new trade', () => {
  it('prefills the New Trade form when creating from analysis', async () => {
    render(<TradeJournal />);

    // open Analysis tab inside the Trades card
    const analyseTab = await screen.findByRole('tab', { name: /Analyse/i });
    fireEvent.click(analyseTab);

    // click the create example button
    const createBtn = await screen.findByText(/Create example trade from analysis/i);
    fireEvent.click(createBtn);

    // now the New Trade form on the left should be prefilled with the suggestion (EURUSD)
    await waitFor(() => {
      const symbolInput = screen.getByLabelText(/Symbol/i) as HTMLInputElement;
      expect(symbolInput.value).toMatch(/EURUSD/i);

      const priceInput = screen.getByLabelText(/Price/i) as HTMLInputElement;
      // price may be formatted as string
      expect(parseFloat(priceInput.value)).toBeGreaterThan(0);

      const sizeInput = screen.getByLabelText(/Size/i) as HTMLInputElement;
      expect(Number(sizeInput.value)).toBeGreaterThan(0);
    });
  });
});
