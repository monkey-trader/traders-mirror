/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryAnalysisRepository } from './InMemoryAnalysisRepository';
import { AnalysisFactory } from '@/domain/analysis/factories/AnalysisFactory';
import type { AnalysisDTO } from '@/domain/analysis/interfaces/AnalysisRepository';

describe('InMemoryAnalysisRepository', () => {
  let repo: InMemoryAnalysisRepository;

  beforeEach(() => {
    repo = new InMemoryAnalysisRepository();
  });

  it('saves and retrieves by id', async () => {
    const a = AnalysisFactory.create({
      id: 'a1',
      symbol: 'EURUSD',
      createdAt: new Date().toISOString(),
    });
    await repo.save(a as unknown as AnalysisDTO);
    const got = await repo.getById('a1');
    expect(got).not.toBeNull();
    expect(got!.id).toBe('a1');
  });

  it('lists by symbol', async () => {
    const a1 = AnalysisFactory.create({
      id: 'a1',
      symbol: 'EURUSD',
      createdAt: new Date().toISOString(),
    });
    const a2 = AnalysisFactory.create({
      id: 'a2',
      symbol: 'BTCUSD',
      createdAt: new Date().toISOString(),
    });
    await repo.save(a1 as unknown as AnalysisDTO);
    await repo.save(a2 as unknown as AnalysisDTO);
    const list = await repo.listBySymbol('EURUSD');
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('a1');
  });

  it('seed/listAll/delete/clear behave as expected', async () => {
    repo.seed([
      { id: 's1', symbol: 'S' },
      { id: 's2', symbol: 'S' },
    ] as any);
    expect((await repo.listAll()).map((x) => x.id)).toEqual(['s1', 's2']);
    await repo.delete('s1');
    expect((await repo.listAll()).map((x) => x.id)).toEqual(['s2']);
    await repo.clear();
    expect(await repo.listAll()).toHaveLength(0);
  });
});
