import { render, screen } from '@testing-library/react';
import { TradeJournal } from './TradeJournal';
import InMemoryTradeRepository from '@/infrastructure/trade/repositories/InMemoryTradeRepository';

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- autofix: preserve tests that intentionally use any
(global as any).ResizeObserver = FakeResizeObserver;

// render with injected repo to avoid warnings
describe('TradeJournal entryDate', () => {
  it('prefills entryDate with current datetime (within 2 minutes)', async () => {
    const { container } = render(<TradeJournal repo={new InMemoryTradeRepository()} />);
    await screen.findByText(/Trading Journal/i);

    const entryInput = container.querySelector('#entryDate') as HTMLInputElement | null;
    expect(entryInput).toBeTruthy();

    // parse value and compare with now (allow 2 minute tolerance)
    const val = entryInput!.value;
    const parsed = new Date(val);
    expect(isNaN(parsed.getTime())).toBe(false);

    const now = new Date();
    const diffMs = Math.abs(now.getTime() - parsed.getTime());
    expect(diffMs).toBeLessThanOrEqual(2 * 60 * 1000); // 2 minutes
  });
});
