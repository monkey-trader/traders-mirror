import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository';
import type { RepoTrade } from '@/infrastructure/trade/repositories/LocalStorageTradeRepository';
import type { TradeRow } from './types';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';
import { EntryDate } from '@/domain/trade/valueObjects/EntryDate';
import type { Dispatch, SetStateAction } from 'react';
import type { Trade } from '@/domain/trade/entities/Trade';

// Helper to load/mock-seed trades into a repository or update UI-only when no repo is available
export async function loadMockTrades(
  repo: TradeRepository | null,
  seedSet: RepoTrade[],
  setPositions: Dispatch<SetStateAction<TradeRow[]>>
): Promise<void> {
  // prefer calling a seed method if repo supports it
  const repoAny = repo as unknown as {
    seed?: (trades: RepoTrade[]) => void;
    save?: (t: unknown) => Promise<void>;
    getAll?: () => Promise<Trade[]>;
  } | null;

  if (repoAny && typeof repoAny.seed === 'function') {
    try {
      repoAny.seed(seedSet as RepoTrade[]);
    } catch (err) {
      // keep helper non-throwing; log and continue
      // eslint-disable-next-line no-console
      console.error('seed() call failed', err);
    }
  } else if (repoAny && typeof repoAny.save === 'function') {
    // save each trade sequentially
    for (const rt of seedSet) {
      try {
        const domain = TradeFactory.create(
          rt as unknown as Parameters<typeof TradeFactory.create>[0]
        );
        // repoAny.save is typed as (t: unknown) => Promise<void>
        // eslint-disable-next-line @typescript-eslint/await-thenable
        await repoAny.save(domain);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to save mock trade via save()', err);
      }
    }
  } else {
    // no repo available - update UI only
    // Normalize status to avoid UNKNOWN values in the list when mock items lack a status
    setPositions((prev) => {
      const combined = seedSet.map((t) => ({ ...t }));
      const dto = combined.map((c) => ({
        ...c,
        entryDate: EntryDate.toInputValue((c as unknown as { entryDate?: string }).entryDate),
        status: (c as unknown as { status?: unknown }).status ?? 'OPEN',
      })) as unknown as TradeRow[];
      return [...dto, ...prev];
    });
  }

  // reload canonical trades from repo if possible
  if (
    repo &&
    typeof (repo as unknown as { getAll?: () => Promise<Trade[]> }).getAll === 'function'
  ) {
    try {
      const domainTrades = await (repo as unknown as { getAll: () => Promise<Trade[]> }).getAll();
      const dtoTrades = domainTrades.map((dt) => TradeFactory.toDTO(dt)) as unknown as TradeRow[];
      setPositions(dtoTrades);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to reload trades after seeding', err);
    }
  }
}
