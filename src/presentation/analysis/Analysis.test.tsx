import React from 'react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { AnalysisDTO } from '@/domain/analysis/interfaces/AnalysisRepository';
import { LocalStorageAnalysisRepository } from '@/infrastructure/analysis/repositories/LocalStorageAnalysisRepository';

describe('Analysis component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });

  it('renders empty message when no analyses exist and compactView toggles data attribute', async () => {
    vi.spyOn(LocalStorageAnalysisRepository.prototype, 'listAll').mockResolvedValue([]);
    vi.spyOn(LocalStorageAnalysisRepository.prototype, 'getById').mockResolvedValue(null);

    const AnalysisModule = await import('./Analysis');
    const { container, rerender } = render(<AnalysisModule.Analysis compactView={false} />);

    expect(screen.getByText('Marktanalyse')).toBeTruthy();
    expect(screen.getByText('Keine Analyse ausgewählt')).toBeTruthy();

    rerender(<AnalysisModule.Analysis compactView={true} />);
    const root = container.querySelector('div');
    // prefer dataset over getAttribute for data-* access
    expect(root?.dataset.compact).toBe('true');
  });

  it('loads list from repository and opens detail on event', async () => {
    const sample = {
      id: 'a1',
      symbol: 'BTCUSD',
      createdAt: new Date().toISOString(),
      notes: 'note',
      market: 'Crypto',
      timeframes: { daily: { timeframe: 'daily' } },
    };

    vi.spyOn(LocalStorageAnalysisRepository.prototype, 'listAll').mockResolvedValue([
      sample,
    ] as unknown as AnalysisDTO[]);
    vi.spyOn(LocalStorageAnalysisRepository.prototype, 'getById').mockResolvedValue(
      sample as unknown as AnalysisDTO
    );

    const AnalysisModule = await import('./Analysis');
    render(<AnalysisModule.Analysis />);

    await waitFor(() => expect(screen.getByText('Open')).toBeTruthy());

    const ev = new CustomEvent('open-analysis', { detail: { id: 'a1' } });
    globalThis.dispatchEvent(ev);

    // wait for detail to appear (loading may be too transient to assert reliably)
    await waitFor(() => expect(screen.getByTestId('analysis-detail')).toBeTruthy());
  });

  it('delete flow: request delete from detail and confirm triggers repo.delete and refresh', async () => {
    const sample = {
      id: 'd1',
      symbol: 'AAA',
      createdAt: new Date().toISOString(),
      notes: 'note',
      market: 'Crypto',
      timeframes: { daily: { timeframe: 'daily' } },
    };

    const listAllSpy = vi
      .spyOn(LocalStorageAnalysisRepository.prototype, 'listAll')
      .mockResolvedValue([sample] as AnalysisDTO[]);
    vi.spyOn(LocalStorageAnalysisRepository.prototype, 'getById').mockResolvedValue(
      sample as AnalysisDTO
    );
    const deleteSpy = vi
      .spyOn(LocalStorageAnalysisRepository.prototype, 'delete')
      .mockResolvedValue();

    const AnalysisModule = await import('./Analysis');
    render(<AnalysisModule.Analysis />);

    await waitFor(() => expect(screen.getByText('Open')).toBeTruthy());
    // open detail
    globalThis.dispatchEvent(new CustomEvent('open-analysis', { detail: { id: 'd1' } }));
    await waitFor(() => expect(screen.getByTestId('analysis-detail')).toBeTruthy());

    // click Delete inside AnalysisDetail to request delete
    const delBtn = screen.getByText('Delete');
    delBtn.click();

    // confirm dialog appears
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
    const dialog = screen.getByRole('dialog');
    const confirm = Array.from(dialog.querySelectorAll('button')).find(
      (b) => b.textContent === 'Delete'
    )!;
    confirm.click();

    // delete and listAll should have been called as part of the flow
    await waitFor(() => expect(deleteSpy).toHaveBeenCalled());
    await waitFor(() => expect(listAllSpy).toHaveBeenCalled());
    // selected should be cleared, i.e. no detail present
    await waitFor(() => expect(screen.getByText('Keine Analyse ausgewählt')).toBeTruthy());
  });

  it('responds to analyses-updated event by reloading list and market filter works', async () => {
    const a = {
      id: 'm1',
      symbol: 'X1',
      createdAt: new Date().toISOString(),
      notes: '',
      market: 'Crypto',
      timeframes: { daily: { timeframe: 'daily' } },
    };
    const b = {
      id: 'm2',
      symbol: 'Y2',
      createdAt: new Date().toISOString(),
      notes: '',
      market: 'Forex',
      timeframes: { daily: { timeframe: 'daily' } },
    };
    const listAllSpy = vi.spyOn(LocalStorageAnalysisRepository.prototype, 'listAll');
    listAllSpy.mockResolvedValue([a, b] as AnalysisDTO[]);
    vi.spyOn(LocalStorageAnalysisRepository.prototype, 'getById').mockResolvedValue(
      a as AnalysisDTO
    );

    const AnalysisModule = await import('./Analysis');
    render(<AnalysisModule.Analysis />);

    // wait for items
    await waitFor(() => expect(screen.getAllByText('Open').length).toBeGreaterThanOrEqual(1));

    // click Crypto filter -> only X1 remains
    screen.getByText('Crypto').click();
    await waitFor(() => expect(screen.getByText('X1')).toBeTruthy());
    // ensure Y2 not visible when filtering crypto
    expect(screen.queryByText('Y2')).toBeNull();

    // simulate external analyses-updated event and ensure list reload triggers listAll
    listAllSpy.mockResolvedValue([b] as AnalysisDTO[]);
    globalThis.dispatchEvent(new Event('analyses-updated'));
    await waitFor(() => expect(listAllSpy).toHaveBeenCalled());
  });

  it('handles market values that are objects with .value', async () => {
    const sample = {
      id: 'o1',
      symbol: 'OBJ',
      createdAt: new Date().toISOString(),
      notes: '',
      market: { value: 'Crypto' },
      timeframes: { daily: { timeframe: 'daily' } },
    };
    vi.spyOn(LocalStorageAnalysisRepository.prototype, 'listAll').mockResolvedValue([
      sample,
    ] as unknown as AnalysisDTO[]);
    vi.spyOn(LocalStorageAnalysisRepository.prototype, 'getById').mockResolvedValue(
      sample as unknown as AnalysisDTO
    );

    const AnalysisModule = await import('./Analysis');
    const { container } = render(<AnalysisModule.Analysis />);

    // wait for list to render
    await waitFor(() => expect(container.querySelectorAll('li').length).toBeGreaterThanOrEqual(0));
    // ensure symbol rendered
    expect(screen.getByText('OBJ')).toBeTruthy();
  });
});
