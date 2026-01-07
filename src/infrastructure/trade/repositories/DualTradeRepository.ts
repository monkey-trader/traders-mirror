import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository';
import type { Trade } from '@/domain/trade/entities/Trade';
import LocalStorageTradeRepository from './LocalStorageTradeRepository';
import FirebaseTradeRepository from './FirebaseTradeRepository';

/**
 * Dual repository: write to local storage immediately (offline-first), then attempt
 * to sync to Firestore in background. Provides basic logging for which adapters are used
 * and sync results.
 */
export class DualTradeRepository implements TradeRepository {
  private local: LocalStorageTradeRepository;
  private firebase: FirebaseTradeRepository;

  constructor(local?: LocalStorageTradeRepository, firebase?: FirebaseTradeRepository) {
    this.local = local ?? new LocalStorageTradeRepository();
    this.firebase = firebase ?? new FirebaseTradeRepository();
    // eslint-disable-next-line no-console
    console.info('[Repo] using DualTradeRepository (local-first, sync -> firebase)');
  }

  async save(trade: Trade): Promise<void> {
    // Persist locally immediately
    await this.local.save(trade);
    // Fire-and-forget sync to firebase, log outcome
    (async () => {
      try {
        await this.firebase.save(trade);
        // eslint-disable-next-line no-console
                console.info('[Repo][Sync] trade saved to firebase', (trade as Trade)?.id ?? null);
      } catch (err) {
        // eslint-disable-next-line no-console
                console.warn('[Repo][Sync] failed to save trade to firebase', (trade as Trade)?.id ?? null, err);
      }
    })();
  }

  async getAll(): Promise<Trade[]> {
    // Return local copy for fast/ offline access
    return this.local.getAll() as unknown as Trade[];
  }

  async update(trade: Trade): Promise<void> {
    await this.local.update(trade);
    (async () => {
      try {
        await this.firebase.update(trade);
        // eslint-disable-next-line no-console
        console.info('[Repo][Sync] trade updated to firebase', (trade as Trade)?.id ?? null);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[Repo][Sync] failed to update trade to firebase', (trade as Trade)?.id ?? null, err);
      }
    })();
  }

  async delete(id: string): Promise<void> {
    await this.local.delete(id);
    (async () => {
      try {
        await this.firebase.delete(id);
        // eslint-disable-next-line no-console
        console.info('[Repo][Sync] trade deleted on firebase', id);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[Repo][Sync] failed to delete trade on firebase', id, err);
      }
    })();
  }
}

export default DualTradeRepository;
