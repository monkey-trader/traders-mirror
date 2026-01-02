import type {
  AnalysisDTO,
  AnalysisRepository,
} from '@/domain/analysis/interfaces/AnalysisRepository';

export class InMemoryAnalysisRepository implements AnalysisRepository {
  private store: Map<string, AnalysisDTO> = new Map();

  async save(analysis: AnalysisDTO): Promise<void> {
    this.store.set(analysis.id, analysis);
  }

  async getById(id: string): Promise<AnalysisDTO | null> {
    return this.store.get(id) ?? null;
  }

  async listBySymbol(symbol: string): Promise<AnalysisDTO[]> {
    const res: AnalysisDTO[] = [];
    const values = Array.from(this.store.values());
    for (let i = 0; i < values.length; i++) {
      const a = values[i];
      if (a.symbol === symbol) res.push(a);
    }
    return res;
  }

  async listAll(): Promise<AnalysisDTO[]> {
    return Array.from(this.store.values());
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  // helper for tests
  seed(items: AnalysisDTO[]) {
    this.store.clear();
    items.forEach((i) => this.store.set(i.id, i));
  }
}
