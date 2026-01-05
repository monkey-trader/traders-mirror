import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadMockAnalyses, clearAnalyses } from './mockLoader'

describe('mockLoader', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('sets empty list when repo and trades are null', async () => {
    const setAnalyses = vi.fn()
    await loadMockAnalyses(null, null, setAnalyses)
    expect(setAnalyses).toHaveBeenCalledWith([])
  })

  it('uses repo.listAll() when available and calls save for created analyses', async () => {
    const setAnalyses = vi.fn()
    const savedLocal: unknown[] = []
    const repo: {
      save: (a: unknown) => Promise<void>
      listAll: () => Promise<Array<Record<string, unknown>>>
      seed?: () => void
    } = {
      save: vi.fn(async (a: unknown) => { savedLocal.push(a); }),
      listAll: vi.fn(async () => [{ id: 'repo-1', symbol: 'X', createdAt: new Date().toISOString(), notes: 'from-repo' }]),
      seed: vi.fn(),
    }

    const trades = [{ symbol: 'FOO', market: 'Crypto' }]

    type RepoParam = Parameters<typeof loadMockAnalyses>[0]
    type TradesParam = Parameters<typeof loadMockAnalyses>[1]
    const repoTyped = repo as unknown as RepoParam
    const tradesTyped = trades as unknown as TradesParam

    await loadMockAnalyses(repoTyped, tradesTyped, setAnalyses, null, 1)

    // save should have pushed into savedLocal
    expect(savedLocal.length).toBeGreaterThan(0)
    // setAnalyses should have been called with what listAll returned
    expect(setAnalyses).toHaveBeenCalledWith([{ id: 'repo-1', symbol: 'X', createdAt: expect.any(String), notes: 'from-repo' }])
  })

  it('clearAnalyses with null repo clears state', async () => {
    const setAnalyses = vi.fn()
    await clearAnalyses(null, setAnalyses)
    expect(setAnalyses).toHaveBeenCalledWith([])
  })

  it('clearAnalyses prefers clear() then falls back to listAll+delete', async () => {
    const setAnalyses = vi.fn()
    const calls: string[] = []

    const repoWithClear: unknown = {
      clear: vi.fn(async () => calls.push('clear')),
    }
    await clearAnalyses(repoWithClear as unknown as Parameters<typeof clearAnalyses>[0], setAnalyses)
    expect(calls).toContain('clear')
    expect(setAnalyses).toHaveBeenCalledWith([])

    // fallback path
    const deleted: string[] = []
    const repoFallback: unknown = {
      listAll: vi.fn(async () => [{ id: 'a' }, { id: 'b' }]),
      delete: vi.fn(async (id: string) => deleted.push(id)),
    }
    await clearAnalyses(repoFallback as unknown as Parameters<typeof clearAnalyses>[0], setAnalyses)
    expect(deleted).toEqual(['a', 'b'])
  })
})
