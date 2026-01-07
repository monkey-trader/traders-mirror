import type { AnalysisDTO, AnalysisRepository } from '@/domain/analysis/interfaces/AnalysisRepository';
import { LocalStorageAnalysisRepository } from './LocalStorageAnalysisRepository';
import FirebaseAnalysisRepository from './FirebaseAnalysisRepository';

/**
 * Dual repository: write to local storage immediately (offline-first), then attempt
 * to sync to Firestore in background. Provides logging for which adapters are used
 * and sync results.
 */
export class DualAnalysisRepository implements AnalysisRepository {
  private local: LocalStorageAnalysisRepository;
  private firebase: FirebaseAnalysisRepository;

  constructor(local?: LocalStorageAnalysisRepository, firebase?: FirebaseAnalysisRepository) {
    this.local = local ?? new LocalStorageAnalysisRepository();
    this.firebase = firebase ?? new FirebaseAnalysisRepository();
    // eslint-disable-next-line no-console
    console.info('[Repo] using DualAnalysisRepository (local-first, sync -> firebase)');
  }

  async save(analysis: AnalysisDTO): Promise<void> {
    await this.local.save(analysis);
    (async () => {
      try {
        await this.firebase.save(analysis);
        // eslint-disable-next-line no-console
        console.info('[Repo][Sync] analysis saved to firebase', analysis.id);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[Repo][Sync] failed to save analysis to firebase', analysis.id, err);
      }
    })();
  }

  async getById(id: string) {
    return this.local.getById(id);
  }

  async listBySymbol(symbol: string) {
    return this.local.listBySymbol(symbol);
  }

  async listAll() {
    return this.local.listAll();
  }

  async delete(id: string): Promise<void> {
    await this.local.delete(id);
    (async () => {
      try {
        await this.firebase.delete(id);
        // eslint-disable-next-line no-console
        console.info('[Repo][Sync] analysis deleted on firebase', id);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[Repo][Sync] failed to delete analysis on firebase', id, err);
      }
    })();
  }

  async clear(): Promise<void> {
    await this.local.clear();
    // Optionally clear remote as well (not implemented)
  }
}

export default DualAnalysisRepository;