import { describe, it, expect } from 'vitest';
import { AnalysisService } from './AnalysisService';
import { InMemoryAnalysisRepository } from '@/infrastructure/analysis/repositories/InMemoryAnalysisRepository';

describe('AnalysisService', () => {
  it('creates analysis and persists it', async () => {
    const repo = new InMemoryAnalysisRepository();
    const service = new AnalysisService(repo);
    const a = await service.createAnalysis({ symbol: 'ethusd' });
    const got = await repo.getById(a.id);
    expect(got).not.toBeNull();
    const symbol = typeof got!.symbol === 'string' ? got!.symbol : (got!.symbol as { value: string }).value;
    expect(symbol).toBe('ETHUSD');
  });

  it('links trade to analysis', async () => {
    const repo = new InMemoryAnalysisRepository();
    const service = new AnalysisService(repo);
    const a = await service.createAnalysis({ symbol: 'ethusd' });
    const link = await service.linkTradeToAnalysis(a.id, 't1');
    expect(link.analysisId).toBe(a.id);
    expect(link.backlink).toContain(a.id);
  });
});
