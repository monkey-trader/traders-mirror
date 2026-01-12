import type {
  AnalysisDTO,
  AnalysisRepository,
} from '@/domain/analysis/interfaces/AnalysisRepository';
import { LocalStorageAnalysisRepository } from '@/infrastructure/analysis/repositories/LocalStorageAnalysisRepository';
import { FirebaseAnalysisRepository } from '@/infrastructure/analysis/repositories/FirebaseAnalysisRepository';

type OutboxItem =
  | { op: 'save'; dto: AnalysisDTO }
  | { op: 'delete'; id: string };

const OUTBOX_KEY = 'analysis_outbox_v1';

function loadOutbox(): OutboxItem[] {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveOutbox(items: OutboxItem[]): void {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
  } catch {
    // ignore persistence errors
  }
}

export class HybridAnalysisRepository implements AnalysisRepository {
  private readonly local = new LocalStorageAnalysisRepository();
  private readonly remote?: FirebaseAnalysisRepository;

  constructor(options?: { remote?: FirebaseAnalysisRepository }) {
    this.remote = options?.remote;
    if (this.remote) {
      try {
        queueMicrotask(() => {
          try {
            globalThis.dispatchEvent(
              new CustomEvent('repo-sync-status', {
                detail: { feature: 'analysis', status: 'online' },
              })
            );
          } catch {/* ignore */}
        });
      } catch {/* ignore */}
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('online', () => {
          void this.flushOutbox();
        });
      }
      if (typeof navigator !== 'undefined' && (navigator as { onLine?: boolean }).onLine) {
        void this.flushOutbox();
      }
    }
    if (!this.remote) {
      try {
        queueMicrotask(() => {
          try {
            globalThis.dispatchEvent(
              new CustomEvent('repo-sync-status', {
                detail: { feature: 'analysis', status: 'local' },
              })
            );
          } catch {/* ignore */}
        });
      } catch {/* ignore */}
    }
  }

  async save(analysis: AnalysisDTO): Promise<void> {
    await this.local.save(analysis);
    await this.trySync({ op: 'save', dto: analysis });
  }

  async getById(id: string): Promise<AnalysisDTO | null> {
    return this.local.getById(id);
  }

  async listBySymbol(symbol: string): Promise<AnalysisDTO[]> {
    return this.local.listBySymbol(symbol);
  }

  async listAll(): Promise<AnalysisDTO[]> {
    return this.local.listAll();
  }

  async delete(id: string): Promise<void> {
    await this.local.delete(id);
    await this.trySync({ op: 'delete', id });
  }

  async clear(): Promise<void> {
    await this.local.clear();
    // we do not clear remote here to avoid dangerous mass-delete when offline
  }

  private async trySync(item: OutboxItem): Promise<void> {
    if (!this.remote) return;
    try {
      if (item.op === 'delete') {
        await this.remote.delete(item.id);
      } else {
        await this.remote.save(item.dto);
      }
      try {
        globalThis.dispatchEvent(
          new CustomEvent('repo-sync-status', {
            detail: { feature: 'analysis', status: 'online' },
          })
        );
      } catch {
        /* ignore */
      }
    } catch {
      const q = loadOutbox();
      q.push(item);
      saveOutbox(q);
      try {
        globalThis.dispatchEvent(
          new CustomEvent('repo-sync-status', {
            detail: { feature: 'analysis', status: 'queued', queuedCount: q.length },
          })
        );
      } catch {
        /* ignore */
      }
    }
  }

  private async flushOutbox(): Promise<void> {
    if (!this.remote) return;
    const queue = loadOutbox();
    if (!queue.length) return;
    const remain: OutboxItem[] = [];
    for (const item of queue) {
      try {
        if (item.op === 'delete') {
          await this.remote.delete(item.id);
        } else {
          await this.remote.save(item.dto);
        }
      } catch {
        remain.push(item);
      }
    }
    saveOutbox(remain);
    try {
      globalThis.dispatchEvent(
        new CustomEvent('repo-sync-status', {
          detail: {
            feature: 'analysis',
            status: remain.length ? 'queued' : 'online',
            queuedCount: remain.length || undefined,
          },
        })
      );
    } catch {
      /* ignore */
    }
  }
}

export default HybridAnalysisRepository;
