import { describe, it, expect, vi, beforeEach } from 'vitest';
import HybridAnalysisRepository from './HybridAnalysisRepository';

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

describe('HybridAnalysisRepository integration', () => {
  it('queues delete when remote fails and flushOutbox retries and clears pending', async () => {
    // Mock remote repo
    const mockRemote = {
      listAll: vi.fn(async () => []),
      listBySymbol: vi.fn(async () => []),
      getById: vi.fn(async () => null),
      save: vi.fn(async () => undefined),
      delete: vi.fn(),
    } as any;

    // First delete attempt fails, second succeeds
    mockRemote.delete.mockRejectedValueOnce(new Error('network'));
    mockRemote.delete.mockResolvedValue(undefined);

    const repo = new HybridAnalysisRepository({ remote: mockRemote });

    // perform delete (should mark pending and attempt remote delete which fails and queues)
    await repo.delete('A-DELETE-1');

    // wait for async trySync to run and queue outbox
    await new Promise((r) => setTimeout(r, 50));

    const outboxRaw = localStorage.getItem('analysis_outbox_v1');
    expect(outboxRaw).not.toBeNull();
    const outbox = JSON.parse(outboxRaw as string);
    expect(Array.isArray(outbox)).toBe(true);
    expect(outbox.some((it: any) => it.op === 'delete' && it.id === 'A-DELETE-1')).toBe(true);

    const pendingRaw = localStorage.getItem('analysis_pending_deletes_v1');
    const pending = pendingRaw ? JSON.parse(pendingRaw) : [];
    expect(pending).toContain('A-DELETE-1');

    // trigger a flush via the global force event (constructor listens for this)
    try {
      globalThis.dispatchEvent(new CustomEvent('repo-sync-force'));
    } catch {
      /* ignore */
    }

    // wait for flush to process
    await new Promise((r) => setTimeout(r, 100));

    const outboxAfter = localStorage.getItem('analysis_outbox_v1');
    const pendingAfter = localStorage.getItem('analysis_pending_deletes_v1');

    expect(outboxAfter).toBeTruthy();
    const parsedAfter = outboxAfter ? JSON.parse(outboxAfter) : [];
    expect(parsedAfter.length).toBe(0);
    const parsedPendingAfter = pendingAfter ? JSON.parse(pendingAfter) : [];
    expect(parsedPendingAfter.includes('A-DELETE-1')).toBe(false);
  });
});
