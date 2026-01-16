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
  private bootstrapped = false;

  constructor(options?: { remote?: FirebaseAnalysisRepository }) {
    this.remote = options?.remote;
    if (this.remote) {
      // Bootstrap local store from remote once (if authenticated)
      (async () => {
        try {
          if (this.bootstrapped) return;
          this.bootstrapped = true;
          const remoteList = await this.remote!.listAll();
          if (Array.isArray(remoteList) && remoteList.length) {
            for (const a of remoteList) await this.local.save(a);
          }
        } catch {
          /* ignore bootstrap errors */
        }
      })();

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
        // respond to explicit force-sync requests from UI
        try {
          globalThis.addEventListener('repo-sync-force', () => {
            void this.flushOutbox();
          });
        } catch {
          /* ignore */
        }
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
                    typeof src.market === 'string' &&
                    (src.market === 'Forex' || src.market === 'Crypto')
                      ? (src.market as 'Forex' | 'Crypto')
                      : undefined,
                  timeframes: src.timeframes as Record<string, unknown> as unknown as Record<
                    import('@/domain/analysis/interfaces/AnalysisRepository').Timeframe,
                    import('@/domain/analysis/interfaces/AnalysisRepository').TimeframeAnalysisDTO
                  >,
                  notes: typeof src.notes === 'string' ? src.notes : undefined,
                };
                await this.local.save(dto);
              }
              try {
                globalThis.dispatchEvent(
                  new CustomEvent('analyses-updated', { detail: { type: 'remote' } })
                );
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
    } else {
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
        await this.remote.save(analysis);
        await this.local.save(analysis);
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
        /* remote failed, will queue */
      }
    }
    await this.local.save(analysis);
    await this.trySync({ op: 'save', dto: analysis });
  }

  async getById(id: string): Promise<AnalysisDTO | null> {
    // Local-first: return fast local value, then attempt background refresh from remote
    const local = await this.local.getById(id);
    if (this.remote) {
      (async () => {
        try {
          const dto = await this.remote!.getById(id);
          if (dto) await this.local.save(dto);
        } catch {
          /* ignore remote fetch errors */
        }
      })();
    }
    return local;
  }

  async listBySymbol(symbol: string): Promise<AnalysisDTO[]> {
    // Local-first: return quick local list and refresh in background
    const localList = await this.local.listBySymbol(symbol);
    if (this.remote) {
      (async () => {
        try {
          const list = await this.remote!.listBySymbol(symbol);
          if (Array.isArray(list) && list.length) {
            for (const a of list) await this.local.save(a);
            try {
              globalThis.dispatchEvent(
                new CustomEvent('analyses-updated', { detail: { type: 'remote' } })
              );
            } catch {
              /* ignore */
            }
          }
        } catch {
          /* ignore */
        }
      })();
    }
    return localList;
  }

  async listAll(): Promise<AnalysisDTO[]> {
    // Local-first: fast local response, then background remote refresh
    const localList = await this.local.listAll();
    if (this.remote) {
      (async () => {
        try {
          const list = await this.remote!.listAll();
          if (Array.isArray(list) && list.length) {
            for (const a of list) await this.local.save(a);
            try {
              globalThis.dispatchEvent(
                new CustomEvent('analyses-updated', { detail: { type: 'remote' } })
              );
            } catch {
              /* ignore */
            }
          }
        } catch {
          /* ignore */
        }
      })();
    }
    return localList;
  }

  async delete(id: string): Promise<void> {
    if (this.remote) {
      try {
        await this.remote.delete(id);
        await this.local.delete(id);
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
        /* remote failed, will queue */
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
      /* queued for later */
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
