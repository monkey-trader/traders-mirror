import type { AnalysisRepository, AnalysisDTO } from '@/domain/analysis/interfaces/AnalysisRepository';
import type { Trade } from '@/domain/trade/entities/Trade';
import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository';
import { AnalysisFactory } from '@/domain/analysis/factories/AnalysisFactory';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';

// Create random analyses from available trades and optionally link them back to trades
export async function loadMockAnalyses(
  repo: AnalysisRepository | null,
  trades: Trade[] | null,
  setAnalyses: (items: AnalysisDTO[]) => void,
  tradeRepo: TradeRepository | null = null,
  count = 5
): Promise<void> {
  const created: AnalysisDTO[] = [];

  // If trades are available, pick up to `count` distinct trades to create analyses for
  const candidates = Array.isArray(trades) && trades.length > 0 ? [...trades] : [];
  const picks: Trade[] = [];
  while (picks.length < count && candidates.length > 0) {
    const idx = Math.floor(Math.random() * candidates.length);
    picks.push(candidates.splice(idx, 1)[0]);
  }

  // Helper to persist analysis to repo (seed, save or listAll)
  const repoAny = repo as unknown as {
    seed?: (items: AnalysisDTO[]) => void;
    save?: (a: AnalysisDTO) => Promise<void>;
    listAll?: () => Promise<AnalysisDTO[]>;
  } | null;

  for (const t of picks) {
      try {
      const tradeAs = t as Trade;
      const symbolCandidate = (tradeAs as unknown as { symbol?: unknown }).symbol;
      let symbolValue = 'UNKNOWN';
      if (symbolCandidate && typeof symbolCandidate === 'object' && 'value' in (symbolCandidate as Record<string, unknown>)) {
        symbolValue = String((symbolCandidate as Record<string, unknown>).value ?? 'UNKNOWN');
      } else if (typeof symbolCandidate === 'string') {
        symbolValue = symbolCandidate;
      }
      const input = {
        symbol: symbolValue,
        market: (tradeAs as unknown as { market?: string }).market ?? undefined,
        notes: `Mock analysis for ${symbolValue}`,
      };
      const a = AnalysisFactory.create(input as unknown as Parameters<typeof AnalysisFactory.create>[0]);
      created.push(a);
      if (repoAny && typeof repoAny.save === 'function') {
        // persist immediately
        // eslint-disable-next-line @typescript-eslint/await-thenable
        await repoAny.save(a as AnalysisDTO);
      }

      // link analysis id back to the trade when a tradeRepo is provided
      if (tradeRepo && typeof tradeRepo.update === 'function') {
        try {
          // convert existing trade -> DTO -> add analysisId -> create domain Trade -> update
          const dto = TradeFactory.toDTO(t as Trade);
          dto.analysisId = a.id;
          const updated = TradeFactory.create(dto as unknown as Parameters<typeof TradeFactory.create>[0]);
          await tradeRepo.update(updated);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('Failed to link analysis to trade', err);
        }
      }
    } catch (err) {
      // ignore individual failures
      // eslint-disable-next-line no-console
      console.warn('Failed to create mock analysis for trade', err);
    }
  }

  // If repo supports seed, call it for faster bulk insert
  if (repoAny && typeof repoAny.seed === 'function') {
    try {
      repoAny.seed(created);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('seed() call for analyses failed', err);
    }
  }

  // Update UI state to reflect repo contents if available, otherwise use created list
  if (repoAny && typeof repoAny.listAll === 'function') {
    try {
      const all = await repoAny.listAll();
      setAnalyses(all as AnalysisDTO[]);
      return;
    } catch {
      // fallthrough to using created
    }
  }

  setAnalyses(created);
}

// Delete all analyses and optionally clear analysis links from provided trades
export async function clearAnalyses(
  repo: AnalysisRepository | null,
  setAnalyses: (items: AnalysisDTO[]) => void
): Promise<void> {
  if (!repo) {
    setAnalyses([]);
    return;
  }

  try {
    // prefer clear if available
    const repoAny2 = repo as unknown as {
      clear?: () => Promise<void>;
      listAll?: () => Promise<AnalysisDTO[]>;
      delete?: (id: string) => Promise<void>;
    } | null;
    if (repoAny2 && typeof repoAny2.clear === 'function') await repoAny2.clear();
    else if (repoAny2 && typeof repoAny2.listAll === 'function') {
      const all = await repoAny2.listAll();
      for (const a of all) {
        if (typeof repo.delete === 'function') await repo.delete(a.id);
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Failed to clear analyses', err);
  }

  setAnalyses([]);
}

export default { loadMockAnalyses, clearAnalyses };
