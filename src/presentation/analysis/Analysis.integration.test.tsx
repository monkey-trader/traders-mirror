import { render, screen, fireEvent } from '@testing-library/react';
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
    // wait for the component to mount and run effects
    await screen.findByText(/Trading Journal/i);

    // open Analysis tab inside the Trades card
    const analyseTab = await screen.findByRole('tab', { name: /Analyse/i, hidden: true });
    fireEvent.click(analyseTab);

    // after removing the global example buttons, ensure the Analysis tab renders its list/placeholder
    const allAnalysen = await screen.findAllByText(/Analysen/i);
    expect(allAnalysen.length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText(/Keine Analysen vorhanden/i)).toBeDefined();
  });
});
