import type {
  AnalysisDTO,
  AnalysisRepository,
} from '@/domain/analysis/interfaces/AnalysisRepository';

const STORAGE_KEY = 'analyses_v1';

export class LocalStorageAnalysisRepository implements AnalysisRepository {
  async save(analysis: AnalysisDTO): Promise<void> {
    const all = await this.listAll();
    const idx = all.findIndex((a) => a.id === analysis.id);
    if (idx >= 0) {
      all[idx] = analysis;
    } else {
      all.push(analysis);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  async getById(id: string): Promise<AnalysisDTO | null> {
    const all = await this.listAll();
    return all.find((a) => a.id === id) ?? null;
  }

  async listBySymbol(symbol: string): Promise<AnalysisDTO[]> {
    const all = await this.listAll();
    return all.filter((a) => a.symbol === symbol);
  }

  async listAll(): Promise<AnalysisDTO[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      // parsing failed; return empty list
      return [];
    }
  }

  async clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  }
}
