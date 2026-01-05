/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryAnalysisRepository } from './InMemoryAnalysisRepository';
import { AnalysisFactory } from '@/domain/analysis/factories/AnalysisFactory';
import type { AnalysisDTO } from '@/domain/analysis/interfaces/AnalysisRepository';

const unwrap = <T>(v: T | { value: T } | undefined): T | undefined => {
  if (v === undefined || v === null) return v as undefined;
  return (typeof v === 'object' && 'value' in (v as any)) ? (v as any).value as T : (v as T);
};

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
    await repo.save(AnalysisFactory.toDTO(a));
    const got = await repo.getById(unwrap(a.id) as string);
    expect(got).not.toBeNull();
    expect(unwrap(got!.id)).toBe('A1');
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
    await repo.save(AnalysisFactory.toDTO(a1));
    await repo.save(AnalysisFactory.toDTO(a2));
    const list = await repo.listBySymbol('EURUSD');
    expect(list.length).toBe(1);
    expect(unwrap(list[0].id)).toBe('A1');
  });

  it('seed/listAll/delete/clear behave as expected', async () => {
    repo.seed([
      { id: 's1', symbol: 'S' },
      { id: 's2', symbol: 'S' },
    ] as any);
    expect((await repo.listAll()).map((x) => unwrap(x.id))).toEqual(['s1', 's2']);
    await repo.delete('s1');
    expect((await repo.listAll()).map((x) => unwrap(x.id))).toEqual(['s2']);
    await repo.clear();
    expect(await repo.listAll()).toHaveLength(0);
  });
});
