import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository';
import LocalStorageTradeRepository from '@/infrastructure/trade/repositories/LocalStorageTradeRepository';
import FirebaseTradeRepository from '@/infrastructure/trade/repositories/FirebaseTradeRepository';
import { ensureFirebase, getCurrentUserId } from '@/infrastructure/firebase/client';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Trade } from '@/domain/trade/entities/Trade';
import { TradeFactory, type TradeInput } from '@/domain/trade/factories/TradeFactory';

type OutboxItem =
  | { op: 'save'; dto: TradeInput }
  | { op: 'update'; dto: TradeInput }
  | { op: 'delete'; id: string };

const OUTBOX_KEY = 'trade_outbox_v1';

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

export class HybridTradeRepository implements TradeRepository {
  private readonly local = new LocalStorageTradeRepository(undefined, { seedDefaults: false });
  private readonly remote?: FirebaseTradeRepository;
  private bootstrapped = false;

  constructor(options?: { remote?: FirebaseTradeRepository }) {
    this.remote = options?.remote;

    // Bootstrap local store from remote on startup (once, if authenticated)
    if (this.remote) {
      (async () => {
        try {
          if (this.bootstrapped) return;
          this.bootstrapped = true;
          const remoteTrades = await this.remote!.getAll();
          if (Array.isArray(remoteTrades) && remoteTrades.length) {
            for (const t of remoteTrades) {
              await this.local.update(t);
            }
          }
        } catch {
          // ignore bootstrap errors (unauthenticated/offline)
        }
      })();

      try {
        queueMicrotask(() => {
          try {
            globalThis.dispatchEvent(
              new CustomEvent('repo-sync-status', {
                detail: { feature: 'trade', status: 'online' },
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
      // Best effort flush on startup if online
      if (typeof navigator !== 'undefined' && (navigator as { onLine?: boolean }).onLine) {
        void this.flushOutbox();
      }

      // Real-time subscription: mirror remote changes to local and notify UI
      try {
        const { db } = ensureFirebase();
        const uid = getCurrentUserId();
        if (uid) {
          const q = query(collection(db, 'users', uid, 'trades'));
          onSnapshot(q, async (snap) => {
            try {
              const items = snap.docs.map(
                (d) =>
                  d.data() as import('@/infrastructure/trade/repositories/FirebaseTradeRepository').RepoTrade
              );
              for (const rt of items) {
                try {
                  const t = TradeFactory.create({
                    id: rt.id,
                    symbol: rt.symbol,
                    entryDate: rt.entryDate,
                    size: rt.size,
                    price: rt.price,
                    side: rt.side,
                    notes: rt.notes,
                    market: rt.market,
                    sl: rt.sl,
                    tp1: rt.tp1,
                    tp2: rt.tp2,
                    tp3: rt.tp3,
                    tp4: rt.tp4,
                    leverage: rt.leverage,
                    margin: rt.margin,
                    analysisId: rt.analysisId,
                    status: rt.status,
                  });
                  await this.local.update(t);
                } catch {
                  /* ignore individual conversion errors */
                }
              }
              try {
                globalThis.dispatchEvent(
                  new CustomEvent('trades-updated', { detail: { type: 'remote' } })
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
        // ignore subscription setup errors
      }
    } else {
      try {
        queueMicrotask(() => {
          try {
            globalThis.dispatchEvent(
              new CustomEvent('repo-sync-status', {
                detail: { feature: 'trade', status: 'local' },
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

  async getAll(): Promise<Trade[]> {
    // Local-first: read from fast LocalStorage cache
    // Real-time listener keeps local in sync with remote changes
    // Bootstrap (on construction) ensures initial sync from remote
    return this.local.getAll();
  }

  async save(trade: Trade): Promise<void> {
    // Remote-first write; if remote fails, persist locally and queue
    const dto = TradeFactory.toDTO(trade);
    if (this.remote) {
      try {
        await this.remote.save(TradeFactory.create(dto));
        await this.local.update(trade);
        try {
          globalThis.dispatchEvent(
            new CustomEvent('repo-sync-status', {
              detail: { feature: 'trade', status: 'online' },
            })
          );
        } catch {
          /* ignore */
        }
        return;
      } catch {
        // fall through to local + outbox
      }
    }
    await this.local.save(trade);
    await this.trySync({ op: 'save', dto });
  }

  async update(trade: Trade): Promise<void> {
    const dto = TradeFactory.toDTO(trade);
    if (this.remote) {
      try {
        await this.remote.update(TradeFactory.create(dto));
        await this.local.update(trade);
        try {
          globalThis.dispatchEvent(
            new CustomEvent('repo-sync-status', {
              detail: { feature: 'trade', status: 'online' },
            })
          );
        } catch {
          /* ignore */
        }
        return;
      } catch {
        // fall through to local + outbox
      }
    }
    await this.local.update(trade);
    await this.trySync({ op: 'update', dto });
  }

  async delete(id: string): Promise<void> {
    if (this.remote) {
      try {
        await this.remote.delete(id);
        await this.local.delete(id);
        try {
          globalThis.dispatchEvent(
            new CustomEvent('repo-sync-status', {
              detail: { feature: 'trade', status: 'online' },
            })
          );
        } catch {
          /* ignore */
        }
        return;
      } catch {
        // fall through to local + outbox
      }
    }
    await this.local.delete(id);
    await this.trySync({ op: 'delete', id });
  }

  private async trySync(item: OutboxItem): Promise<void> {
    if (!this.remote) return; // no remote configured, local-only mode
    try {
      if (item.op === 'delete') {
        await this.remote.delete(item.id);
      } else if (item.op === 'save') {
        await this.remote.save(TradeFactory.create(item.dto));
      } else {
        await this.remote.update(TradeFactory.create(item.dto));
      }
      try {
        globalThis.dispatchEvent(
          new CustomEvent('repo-sync-status', {
            detail: { feature: 'trade', status: 'online' },
          })
        );
      } catch {
        /* ignore */
      }
    } catch {
      // Queue for later
      const current = loadOutbox();
      current.push(item);
      saveOutbox(current);
      try {
        globalThis.dispatchEvent(
          new CustomEvent('repo-sync-status', {
            detail: { feature: 'trade', status: 'queued', queuedCount: current.length },
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
    const remaining: OutboxItem[] = [];
    for (const item of queue) {
      try {
        if (item.op === 'delete') {
          await this.remote.delete(item.id);
        } else if (item.op === 'save') {
          await this.remote.save(TradeFactory.create(item.dto));
        } else {
          await this.remote.update(TradeFactory.create(item.dto));
        }
      } catch {
        remaining.push(item);
      }
    }
    saveOutbox(remaining);
    try {
      globalThis.dispatchEvent(
        new CustomEvent('repo-sync-status', {
          detail: {
            feature: 'trade',
            status: remaining.length ? 'queued' : 'online',
            queuedCount: remaining.length || undefined,
          },
        })
      );
    } catch {
      /* ignore */
    }
  }
}

export default HybridTradeRepository;
