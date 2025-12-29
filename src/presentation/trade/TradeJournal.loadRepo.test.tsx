import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import { TradeJournal } from './TradeJournal';
import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository';
import type { RepoTrade } from '@/infrastructure/trade/repositories/LocalStorageTradeRepository';

// Workaround: jsdom does not implement HTMLFormElement.prototype.submit and some UI button clicks
// trigger submit in our components. Provide a no-op stub here so tests don't throw.
(HTMLFormElement.prototype as unknown as { submit?: () => void }).submit = function () {
  // no-op for tests
};

class MockRepo implements TradeRepository {
  public seeded = false;
  async getAll() {
    return [];
  }
  async save(_trade: import('@/domain/trade/entities/Trade').Trade) {
    void _trade;
    return Promise.resolve();
  }
  async update(_trade: import('@/domain/trade/entities/Trade').Trade) {
    void _trade;
    return Promise.resolve();
  }
  async delete(_id: string) {
    void _id;
    return Promise.resolve();
  }
  async seed(_trades: RepoTrade[]) {
    void _trades;
    this.seeded = true;
    return Promise.resolve();
  }
}

describe('TradeJournal repo load paths', () => {
  it('calls repo.seed when loading mock data with repo present', async () => {
    const repo = new MockRepo();
    const spySeed = vi.spyOn(repo, 'seed');

    render(<TradeJournal repo={repo} />);

    const loadBtn = screen.getByRole('button', { name: /Load mock data/i });
    fireEvent.click(loadBtn);

    const dialog = await screen.findByRole('dialog');
    const loadModalBtn = Array.from(dialog.querySelectorAll('button')).find((b) =>
      /Load/i.test(b.textContent || '')
    );
    if (!loadModalBtn) throw new Error('Load button not found');
    fireEvent.click(loadModalBtn);

    await waitFor(() => expect(spySeed).toHaveBeenCalled());
  });
});
