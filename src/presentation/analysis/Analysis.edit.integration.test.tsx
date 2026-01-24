import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import type { AnalysisDTO } from '@/domain/analysis/interfaces/AnalysisRepository';
import { LocalStorageAnalysisRepository } from '@/infrastructure/analysis/repositories/LocalStorageAnalysisRepository';

// Mock ResizeObserver for jsdom environment used in tests
class FakeResizeObserver {
  callback: unknown;
  constructor(cb: unknown) {
    this.callback = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).ResizeObserver = FakeResizeObserver;

describe('Analysis edit -> save flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });

  it('opens detail, goes into edit mode and saves changes', async () => {
    const sample = {
      id: 'ea1',
      symbol: 'BTCUSD',
      createdAt: new Date().toISOString(),
      notes: 'original',
      market: 'Crypto',
      timeframes: { daily: { timeframe: 'daily' } },
    } as unknown as AnalysisDTO;

    const listAllSpy = vi
      .spyOn(LocalStorageAnalysisRepository.prototype, 'listAll')
      .mockResolvedValue([sample as unknown as AnalysisDTO]);
    vi.spyOn(LocalStorageAnalysisRepository.prototype, 'getById').mockResolvedValue(sample as unknown as AnalysisDTO);

    const saveSpy = vi.spyOn(LocalStorageAnalysisRepository.prototype, 'save').mockResolvedValue();

    const AnalysisModule = await import('./Analysis');
    render(<AnalysisModule.Analysis />);

    // wait for list render (localized label)
    await waitFor(() =>
      expect(screen.getAllByText('Detail öffnen').length).toBeGreaterThanOrEqual(1)
    );

    // open detail via event
    globalThis.dispatchEvent(new CustomEvent('open-analysis', { detail: { id: 'ea1' } }));

    // wait for detail to appear
    await waitFor(() => expect(screen.getByTestId('analysis-detail')).toBeTruthy());

    // click symbol in the list to enter edit mode (role=button, text=BTCUSD)
    const symbolBtn = screen.getByRole('button', { name: sample.symbol });
    symbolBtn.click();

    // editor should appear
    await waitFor(() => expect(screen.getByTestId('analysis-editor')).toBeTruthy());

    // change symbol and notes
    const symbolInput = screen.getByLabelText('Symbol') as HTMLInputElement;
    fireEvent.change(symbolInput, { target: { value: 'BTCUSD-EDIT' } });

    const notesInput = screen.getByLabelText('Notes') as HTMLTextAreaElement;
    fireEvent.change(notesInput, { target: { value: 'edited-notes' } });

    // click Save
    const saveBtn = screen.getByText('Save');
    saveBtn.click();

    // ensure save called with updated symbol
    await waitFor(() => expect(saveSpy).toHaveBeenCalled());
    const calledWith = saveSpy.mock.calls[0][0];
    expect(calledWith).toBeTruthy();
    expect(calledWith.symbol).toBe('BTCUSD-EDIT');
    expect(calledWith.notes).toBe('edited-notes');

    // ensure listAll was used to populate list earlier
    expect(listAllSpy).toHaveBeenCalled();
  });
});
