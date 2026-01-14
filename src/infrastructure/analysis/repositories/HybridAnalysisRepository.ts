import type {
  AnalysisDTO,
  AnalysisRepository,
} from '@/domain/analysis/interfaces/AnalysisRepository';
import { LocalStorageAnalysisRepository } from '@/infrastructure/analysis/repositories/LocalStorageAnalysisRepository';
import { FirebaseAnalysisRepository } from '@/infrastructure/analysis/repositories/FirebaseAnalysisRepository';
import { ensureFirebase, getCurrentUserId } from '@/infrastructure/firebase/client';
import { collection, onSnapshot, query } from 'firebase/firestore';

type OutboxItem = { op: 'save'; dto: AnalysisDTO } | { op: 'delete'; id: string };

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
      // eslint-disable-next-line no-console
      console.info('[HybridRepo:Analysis] remote configured: online mode');
      try {
        queueMicrotask(() => {
          try {
            globalThis.dispatchEvent(
              new CustomEvent('repo-sync-status', {
                detail: { feature: 'analysis', status: 'online' },
              })
            );
          } catch {
            /* ignore */
          }
        });
      } catch {
        /* ignore */
      }
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('online', () => {
          void this.flushOutbox();
        });
      }
      if (typeof navigator !== 'undefined' && (navigator as { onLine?: boolean }).onLine) {
        void this.flushOutbox();
      }

      // Real-time sync from remote: mirror changes to local and notify UI
      try {
        const { db } = ensureFirebase();
        const uid = getCurrentUserId();
        if (uid) {
          const q = query(collection(db, 'users', uid, 'analyses'));
          onSnapshot(q, async (snap) => {
            try {
              const items = snap.docs.map((d) => d.data() as Record<string, unknown>);
              for (const src of items) {
                const dto: import('@/domain/analysis/interfaces/AnalysisRepository').AnalysisDTO = {
                  id: String(src.id),
                  symbol: String(src.symbol),
                  createdAt: String(src.createdAt ?? new Date().toISOString()),
                  updatedAt: typeof src.updatedAt === 'string' ? src.updatedAt : undefined,
                  market:
                    typeof src.market === 'string' && (src.market === 'Forex' || src.market === 'Crypto')
                      ? (src.market as 'Forex' | 'Crypto')
                      : undefined,
                  timeframes: (src.timeframes as Record<string, unknown>) as unknown as Record<
                    import('@/domain/analysis/interfaces/AnalysisRepository').Timeframe,
                    import('@/domain/analysis/interfaces/AnalysisRepository').TimeframeAnalysisDTO
                  >,
                  notes: typeof src.notes === 'string' ? src.notes : undefined,
                };
                await this.local.save(dto);
              }
              try {
                globalThis.dispatchEvent(new CustomEvent('analyses-updated', { detail: { type: 'remote' } }));
              } catch {
                /* ignore */
              }
            } catch {
              /* ignore snapshot processing errors */
            }
          });
        }
      } catch {
        // ignore subscription setup errors (e.g., missing env vars in tests)
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
          } catch {
            /* ignore */
          }
        });
      } catch {
        /* ignore */
      }
    }
  }

  async save(analysis: AnalysisDTO): Promise<void> {
    // Remote-first write; on failure, persist locally and queue
    if (this.remote) {
      try {
        // eslint-disable-next-line no-console
        console.info('[HybridRepo:Analysis] save: remote first', analysis.id);
        await this.remote.save(analysis);
        await this.local.save(analysis);
        // eslint-disable-next-line no-console
        console.info('[HybridRepo:Analysis] save: mirrored to local', analysis.id);
        try {
          globalThis.dispatchEvent(
            new CustomEvent('repo-sync-status', {
              detail: { feature: 'analysis', status: 'online' },
            })
          );
        } catch {
          /* ignore */
        }
        return;
      } catch {
        // fall through to local + outbox
        // eslint-disable-next-line no-console
        console.warn('[HybridRepo:Analysis] save: remote failed, queueing', analysis.id);
      }
    }
    await this.local.save(analysis);
    await this.trySync({ op: 'save', dto: analysis });
  }

  async getById(id: string): Promise<AnalysisDTO | null> {
    if (this.remote) {
      try {
        // eslint-disable-next-line no-console
        console.info('[HybridRepo:Analysis] getById: try remote first', id);
        const dto = await this.remote.getById(id);
        if (dto) await this.local.save(dto);
        return dto;
      } catch {
        // ignore and fall back
        // eslint-disable-next-line no-console
        console.warn('[HybridRepo:Analysis] getById: remote failed, using local', id);
      }
    }
    return this.local.getById(id);
  }

  async listBySymbol(symbol: string): Promise<AnalysisDTO[]> {
    if (this.remote) {
      try {
        // eslint-disable-next-line no-console
        console.info('[HybridRepo:Analysis] listBySymbol: try remote first', symbol);
        const list = await this.remote.listBySymbol(symbol);
        if (Array.isArray(list) && list.length) {
          for (const a of list) await this.local.save(a);
        }
        // eslint-disable-next-line no-console
        console.info('[HybridRepo:Analysis] listBySymbol: remote returned', list.length);
        return list;
      } catch {
        // fall back
        // eslint-disable-next-line no-console
        console.warn('[HybridRepo:Analysis] listBySymbol: remote failed, using local');
      }
    }
    return this.local.listBySymbol(symbol);
  }

  async listAll(): Promise<AnalysisDTO[]> {
    if (this.remote) {
      try {
        // eslint-disable-next-line no-console
        console.info('[HybridRepo:Analysis] listAll: try remote first');
        const list = await this.remote.listAll();
        if (Array.isArray(list) && list.length) {
          for (const a of list) await this.local.save(a);
        }
        // eslint-disable-next-line no-console
        console.info('[HybridRepo:Analysis] listAll: remote returned', list.length);
        return list;
      } catch {
        // fall back
        // eslint-disable-next-line no-console
        console.warn('[HybridRepo:Analysis] listAll: remote failed, using local');
      }
    }
    return this.local.listAll();
  }

  async delete(id: string): Promise<void> {
    if (this.remote) {
      try {
        // eslint-disable-next-line no-console
        console.info('[HybridRepo:Analysis] delete: remote first', id);
        await this.remote.delete(id);
        await this.local.delete(id);
        // eslint-disable-next-line no-console
        console.info('[HybridRepo:Analysis] delete: mirrored to local', id);
        try {
          globalThis.dispatchEvent(
            new CustomEvent('repo-sync-status', {
              detail: { feature: 'analysis', status: 'online' },
            })
          );
        } catch {
          /* ignore */
        }
        return;
      } catch {
        // fall back
        // eslint-disable-next-line no-console
        console.warn('[HybridRepo:Analysis] delete: remote failed, queueing', id);
      }
    }
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
        // eslint-disable-next-line no-console
        console.info('[HybridRepo:Analysis] trySync: delete', item.id);
        await this.remote.delete(item.id);
      } else {
        // eslint-disable-next-line no-console
        console.info('[HybridRepo:Analysis] trySync: save', item.dto.id);
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
      // eslint-disable-next-line no-console
      console.warn('[HybridRepo:Analysis] trySync: queued (size=', q.length, ')');
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
    // eslint-disable-next-line no-console
    console.info('[HybridRepo:Analysis] flushOutbox: attempting', queue.length, 'items');
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
    // eslint-disable-next-line no-console
    console.info('[HybridRepo:Analysis] flushOutbox: remaining', remain.length);
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
