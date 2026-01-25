import type {
  AnalysisDTO,
  AnalysisRepository,
} from '@/domain/analysis/interfaces/AnalysisRepository';
import { LocalStorageAnalysisRepository } from '@/infrastructure/analysis/repositories/LocalStorageAnalysisRepository';
import { FirebaseAnalysisRepository } from '@/infrastructure/analysis/repositories/FirebaseAnalysisRepository';
import LocalStorageTradeRepository from '@/infrastructure/trade/repositories/LocalStorageTradeRepository';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';
import { ensureFirebase, getCurrentUserId } from '@/infrastructure/firebase/client';
import { collection, onSnapshot, query, where, getDocs, updateDoc, deleteField } from 'firebase/firestore';

type OutboxItem = { op: 'save'; dto: AnalysisDTO } | { op: 'delete'; id: string };

const OUTBOX_KEY = 'analysis_outbox_v1';
const PENDING_DELETES_KEY = 'analysis_pending_deletes_v1';

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

function loadPendingDeletes(): string[] {
  try {
    const raw = localStorage.getItem(PENDING_DELETES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePendingDeletes(ids: string[]): void {
  try {
    localStorage.setItem(PENDING_DELETES_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

function addPendingDelete(id: string): void {
  const list = loadPendingDeletes();
  if (!list.includes(id)) {
    list.push(id);
    savePendingDeletes(list);
  }
}

function removePendingDelete(id: string): void {
  const list = loadPendingDeletes().filter((x) => x !== id);
  savePendingDeletes(list);
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
            const pending = loadPendingDeletes();
            for (const a of remoteList) {
              try {
                if (pending.includes(a.id)) continue; // skip items pending local deletion
                await this.local.save(a);
              } catch {
                /* ignore per-item save errors */
              }
            }
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
              const pending = loadPendingDeletes();
              for (const src of items) {
                const id = String(src.id);
                if (pending.includes(id)) continue; // skip remote items pending deletion locally
                const dto: import('@/domain/analysis/interfaces/AnalysisRepository').AnalysisDTO = {
                  id,
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
    // Local-first write: persist immediately and enqueue a background sync to remote
    await this.local.save(analysis);
    if (this.remote) {
      // attempt remote save in background; if it fails it will be queued by trySync
      void this.trySync({ op: 'save', dto: analysis });
      return;
    }
    // no remote configured — remain local-only
  }

  async getById(id: string): Promise<AnalysisDTO | null> {
    // Local-first: return fast local value, then attempt background refresh from remote
    const local = await this.local.getById(id);
    if (this.remote) {
      (async () => {
        try {
          const pending = loadPendingDeletes();
          if (pending.includes(id)) return; // skip refresh for items pending deletion
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
            const pending = loadPendingDeletes();
            for (const a of list) {
              try {
                if (pending.includes(a.id)) continue;
                await this.local.save(a);
              } catch {
                /* ignore per-item save errors */
              }
            }
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
            const pending = loadPendingDeletes();
            for (const a of list) {
              try {
                if (pending.includes(a.id)) continue;
                await this.local.save(a);
              } catch {
                /* ignore per-item save errors */
              }
            }
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
    // Local-first delete with tombstone: mark pending-delete to avoid remote mirror re-adding
    addPendingDelete(id);
    await this.local.delete(id);
    // remove analysis link from any trades that reference this analysis
    try {
      const tradeRepo = new LocalStorageTradeRepository();
      const trades = await tradeRepo.getAll();
      for (const t of trades) {
        try {
          // compare normalized AnalysisId values (AnalysisId stores uppercase trimmed value)
          if (t.analysisId && t.analysisId.value === String(id).trim().toUpperCase()) {
            // create a new Trade instance with analysisId cleared and persist
            const dto = TradeFactory.toDTO(t);
            dto.analysisId = undefined;
            const updatedTrade = TradeFactory.create(dto);
            await tradeRepo.update(updatedTrade);
          }
        } catch {
          /* ignore per-trade update errors */
        }
      }
      try {
        globalThis.dispatchEvent(new CustomEvent('trades-updated'));
      } catch {
        /* ignore */
      }
    } catch {
      /* ignore trade cleanup errors */
    }
    // If we have a remote configured (Firebase), also clear analysisId on remote trade docs
    try {
      if (this.remote) {
        try {
          const { db } = ensureFirebase();
          const uid = getCurrentUserId();
          if (uid) {
            const tradesCol = collection(db, 'users', uid, 'trades');
            const q = query(tradesCol, where('analysisId', '==', id));
            const snap = await getDocs(q as any);
            for (const d of snap.docs) {
              try {
                await updateDoc(d.ref, { analysisId: deleteField() });
              } catch {
                /* ignore per-doc update errors */
              }
            }
            try {
              globalThis.dispatchEvent(new CustomEvent('trades-updated'));
            } catch {
              /* ignore */
            }
          }
        } catch {
          /* ignore firebase errors */
        }
      }
    } catch {
      /* ignore */
    }
    // As a safety-net: directly clean any lingering analysisId fields in localStorage
    try {
      const key = 'mt_trades_v1';
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
          const normalizedId = String(id).trim().toUpperCase();
          let changed = false;
          const cleaned = parsed.map((item) => {
            if (item && typeof item === 'object' && 'analysisId' in item && item.analysisId) {
              try {
                if (String(item.analysisId).trim().toUpperCase() === normalizedId) {
                  const copy = { ...item };
                  delete copy.analysisId;
                  changed = true;
                  return copy;
                }
              } catch {
                /* ignore per-item parse errors */
              }
            }
            return item;
          });
          if (changed) {
            try {
              window.localStorage.setItem(key, JSON.stringify(cleaned));
              try {
                globalThis.dispatchEvent(new CustomEvent('trades-updated'));
              } catch {
                /* ignore */
              }
            } catch {
              /* ignore persistence errors */
            }
          }
        } catch {
          /* ignore JSON parse errors */
        }
      }
    } catch {
      /* ignore safety-net errors */
    }
    if (this.remote) {
      void this.trySync({ op: 'delete', id });
      return;
    }
    // no remote configured — clear pending immediately
    removePendingDelete(id);
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
        // remote delete succeeded — remove tombstone
        try {
          removePendingDelete(item.id);
        } catch {
          /* ignore */
        }
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
          try {
            removePendingDelete(item.id);
          } catch {
            /* ignore */
          }
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
