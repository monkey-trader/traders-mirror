import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageAnalysisRepository } from './LocalStorageAnalysisRepository'
import type { AnalysisDTO } from '@/domain/analysis/interfaces/AnalysisRepository'

const STORAGE_KEY = 'analyses_v1'

describe('LocalStorageAnalysisRepository', () => {
  let repo: LocalStorageAnalysisRepository

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY)
    repo = new LocalStorageAnalysisRepository()
  })

  it('listAll returns empty when none present', async () => {
    expect(await repo.listAll()).toEqual([])
  })

  it('save persists and getById/listBySymbol work', async () => {
    const a: AnalysisDTO = { id: 'l1', symbol: 'AAA' } as AnalysisDTO
    await repo.save(a as any)
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw as string)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed[0].id).toBe('l1')

    expect(await repo.getById('l1')).toEqual(a)
    expect((await repo.listBySymbol('AAA')).map((x) => x.id)).toEqual(['l1'])
  })

  it('save updates existing entry', async () => {
    const a = { id: 'l2', symbol: 'S' } as AnalysisDTO
    await repo.save(a as any)
    await repo.save({ ...a, symbol: 'S2' } as any)
    expect((await repo.listAll())[0].symbol).toBe('S2')
  })

  it('delete removes item and clear removes key', async () => {
    await repo.save({ id: 'x1', symbol: 'X' } as any)
    await repo.save({ id: 'x2', symbol: 'X' } as any)
    await repo.delete('x1')
    expect((await repo.listAll()).map((x) => x.id)).toEqual(['x2'])
    await repo.clear()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('listAll recovers from invalid JSON', async () => {
    localStorage.setItem(STORAGE_KEY, 'not-a-json')
    expect(await repo.listAll()).toEqual([])
  })
})
