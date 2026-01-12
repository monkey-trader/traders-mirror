import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository';
import LocalStorageTradeRepository from '@/infrastructure/trade/repositories/LocalStorageTradeRepository';
import FirebaseTradeRepository from '@/infrastructure/trade/repositories/FirebaseTradeRepository';
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

  constructor(options?: { remote?: FirebaseTradeRepository }) {
    this.remote = options?.remote;

    // Attempt immediate flush and on network regain
    if (this.remote) {
      // Bootstrap local store from remote on startup (if authenticated)
      try {
        (async () => {
          try {
            // eslint-disable-next-line no-console
            console.info('[HybridRepo:Trade] bootstrap: fetching remote trades');
            const remoteTrades = await this.remote!.getAll();
            if (Array.isArray(remoteTrades) && remoteTrades.length) {
              for (const t of remoteTrades) {
                await this.local.update(t);
              }
              // eslint-disable-next-line no-console
              console.info(
                '[HybridRepo:Trade] bootstrap: mirrored',
                remoteTrades.length,
                'trades to local'
              );
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[HybridRepo] initial remote sync failed or unauthenticated', err);
          }
        })();
      } catch {
        /* ignore */
      }
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
      }
      // Best effort flush on startup if online
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
    // Remote-first: try to read from remote, mirror to local, fall back to local
    if (this.remote) {
      try {
        // eslint-disable-next-line no-console
        console.info('[HybridRepo:Trade] getAll: try remote first');
        const remoteTrades = await this.remote.getAll();
        if (Array.isArray(remoteTrades) && remoteTrades.length) {
          for (const t of remoteTrades) {
            await this.local.update(t);
          }
          // eslint-disable-next-line no-console
          console.info('[HybridRepo:Trade] getAll: remote returned', remoteTrades.length);
          return remoteTrades;
        }
        // If remote returns empty, prefer local so unsynced items remain visible
        // eslint-disable-next-line no-console
        console.info('[HybridRepo:Trade] getAll: remote empty, using local');
        return this.local.getAll();
      } catch (err) {
        // ignore errors (unauthenticated/offline), fall back to local
        // eslint-disable-next-line no-console
        console.warn('[HybridRepo:Trade] getAll: remote failed, using local', err);
      }
    }
    return this.local.getAll();
  }

  async save(trade: Trade): Promise<void> {
    // Remote-first write; if remote fails, persist locally and queue
    const dto = TradeFactory.toDTO(trade);
    if (this.remote) {
      try {
        // eslint-disable-next-line no-console
        console.info('[HybridRepo:Trade] save: remote first', dto.id);
        await this.remote.save(TradeFactory.create(dto));
        await this.local.update(trade);
        // eslint-disable-next-line no-console
        console.info('[HybridRepo:Trade] save: mirrored to local', dto.id);
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
      } catch (err) {
        // fall through to local + outbox
        // eslint-disable-next-line no-console
        console.warn('[HybridRepo:Trade] save: remote failed, queueing', dto.id, err);
      }
    }
    await this.local.save(trade);
    await this.trySync({ op: 'save', dto });
  }

  async update(trade: Trade): Promise<void> {
    const dto = TradeFactory.toDTO(trade);
    if (this.remote) {
      try {
        // eslint-disable-next-line no-console
        console.info('[HybridRepo:Trade] update: remote first', dto.id);
        await this.remote.update(TradeFactory.create(dto));
        await this.local.update(trade);
        // eslint-disable-next-line no-console
        console.info('[HybridRepo:Trade] update: mirrored to local', dto.id);
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
      } catch (err) {
        // fall through to local + outbox
        // eslint-disable-next-line no-console
        console.warn('[HybridRepo:Trade] update: remote failed, queueing', dto.id, err);
      }
    }
    await this.local.update(trade);
    await this.trySync({ op: 'update', dto });
  }

  async delete(id: string): Promise<void> {
    if (this.remote) {
      try {
        // eslint-disable-next-line no-console
        console.info('[HybridRepo:Trade] delete: remote first', id);
        await this.remote.delete(id);
        await this.local.delete(id);
        // eslint-disable-next-line no-console
        console.info('[HybridRepo:Trade] delete: mirrored to local', id);
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
      } catch (err) {
        // fall through to local + outbox
        // eslint-disable-next-line no-console
        console.warn('[HybridRepo:Trade] delete: remote failed, queueing', id, err);
      }
    }
    await this.local.delete(id);
    await this.trySync({ op: 'delete', id });
  }

  private async trySync(item: OutboxItem): Promise<void> {
    if (!this.remote) return; // no remote configured, local-only mode
    try {
      if (item.op === 'delete') {
        // eslint-disable-next-line no-console
        console.info('[HybridRepo:Trade] trySync: delete', item.id);
        await this.remote.delete(item.id);
      } else if (item.op === 'save') {
        // eslint-disable-next-line no-console
        console.info('[HybridRepo:Trade] trySync: save', item.dto.id);
        await this.remote.save(TradeFactory.create(item.dto));
      } else {
        // eslint-disable-next-line no-console
        console.info('[HybridRepo:Trade] trySync: update', item.dto.id);
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
    } catch (err) {
      // Queue for later
      const current = loadOutbox();
      current.push(item);
      saveOutbox(current);
      // eslint-disable-next-line no-console
      console.warn('[HybridRepo:Trade] trySync: queued (size=', current.length, ')', err);
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
    // eslint-disable-next-line no-console
    console.info('[HybridRepo:Trade] flushOutbox: attempting', queue.length, 'items');
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
    // eslint-disable-next-line no-console
    console.info('[HybridRepo:Trade] flushOutbox: remaining', remaining.length);
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
