import type { AnalysisRepository } from '@/domain/analysis/interfaces/AnalysisRepository';
import { AnalysisFactory, AnalysisInput } from '@/domain/analysis/factories/AnalysisFactory';
import type { AnalysisDTO } from '@/domain/analysis/interfaces/AnalysisRepository';

export class AnalysisService {
  constructor(private repo: AnalysisRepository) {}

  async createAnalysis(input: AnalysisInput) {
    const analysis: AnalysisDTO = AnalysisFactory.create(input);
    await this.repo.save(analysis);
    return analysis;
  }

  async getAnalysis(id: string) {
    return this.repo.getById(id);
  }

  async listBySymbol(symbol: string) {
    return this.repo.listBySymbol(symbol);
  }

  async linkTradeToAnalysis(analysisId: string, _tradeId: string) {
    void _tradeId; // mark as used for linter
    const analysis = await this.repo.getById(analysisId);
    if (!analysis) throw new Error('Analysis not found');
    // create backlink URL ( Presentation will resolve routing )
    const backlink = `app://analysis/${analysisId}`;
    // we don't store trades here; return backlink so caller can update trade
    return { analysisId, backlink };
  }
}
