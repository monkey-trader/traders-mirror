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
  private readonly local: LocalStorageTradeRepository;
  private readonly remote?: FirebaseTradeRepository;

  constructor(options?: { remote?: FirebaseTradeRepository }) {
    this.local = new LocalStorageTradeRepository(undefined, { seedDefaults: false });
    this.remote = options?.remote;

    // Attempt immediate flush and on network regain
    if (this.remote) {
      try {
        queueMicrotask(() => {
          try {
            globalThis.dispatchEvent(
              new CustomEvent('repo-sync-status', {
                detail: { feature: 'trade', status: 'online' },
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
          } catch {/* ignore */}
        });
      } catch {/* ignore */}
    }
  }

  async getAll(): Promise<Trade[]> {
    return this.local.getAll();
  }

  async save(trade: Trade): Promise<void> {
    await this.local.save(trade);
    await this.trySync({ op: 'save', dto: TradeFactory.toDTO(trade) });
  }

  async update(trade: Trade): Promise<void> {
    await this.local.update(trade);
    await this.trySync({ op: 'update', dto: TradeFactory.toDTO(trade) });
  }

  async delete(id: string): Promise<void> {
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
