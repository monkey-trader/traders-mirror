import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

// Mock repository before importing the component (module creates instance at load time)
const mockListAll = vi.fn();
const mockGetById = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/infrastructure/analysis/repositories/LocalStorageAnalysisRepository', () => {
  class LocalStorageAnalysisRepository {
    listAll() {
      return mockListAll();
    }
    getById(id: string) {
      return mockGetById(id);
    }
    delete(id: string) {
      return mockDelete(id);
    }
  }
  return { LocalStorageAnalysisRepository };
});

// Stub AnalysisDetail so we can assert DetailLoader behaviour without heavy children
vi.mock('@/presentation/analysis/AnalysisDetail', () => ({
  AnalysisDetail: ({ analysis, onCreateTrade, onRequestDelete }: any) => (
    <div>
      <div data-testid="analysis-detail">{analysis ? analysis.symbol : 'no'}</div>
      <button onClick={() => onCreateTrade && onCreateTrade({ analysisId: analysis.id, symbol: analysis.symbol, price: 0, entryDate: new Date().toISOString(), market: 'Crypto' })}>
        create
      </button>
      <button onClick={() => onRequestDelete && onRequestDelete(analysis.id)}>delete</button>
    </div>
  ),
}));

vi.mock('@/presentation/analysis/AnalysisList', () => ({
  AnalysisList: ({ items, onSelect }: any) => (
    <div>
      {items.map((it: any) => (
        <button key={it.id} onClick={() => onSelect(it.id)}>
          {it.symbol}
        </button>
      ))}
    </div>
  ),
  AnalysisSummary: () => null,
}));

vi.mock('@/presentation/trade/components/TradeFilters/TradeFilters', () => ({
  MarketFilters: ({ marketFilter }: any) => <div>MarketFilters:{marketFilter}</div>,
}));

describe('Analysis component', () => {
  beforeEach(() => {
    mockListAll.mockReset();
    mockGetById.mockReset();
    mockDelete.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders no-selection when repository empty', async () => {
    mockListAll.mockResolvedValue([]);
    const { Analysis } = await import('./Analysis');
    render(<Analysis />);
    expect(screen.getByText('Marktanalyse')).toBeTruthy();
    expect(screen.getByText('Keine Analyse ausgewählt')).toBeTruthy();
  });

  it('responds to open-analysis event and renders detail', async () => {
    const sample = { id: 'a1', symbol: 'BTCUSD', createdAt: new Date().toISOString(), notes: '', market: 'Crypto' };
    mockListAll.mockResolvedValue([sample]);
    mockGetById.mockResolvedValue(sample);

    const { Analysis } = await import('./Analysis');
    render(<Analysis />);

    // ensure list item exists
    await waitFor(() => expect(screen.getByText('BTCUSD')).toBeTruthy());

    // dispatch open-analysis to select it
    window.dispatchEvent(new CustomEvent('open-analysis', { detail: { id: 'a1' } }));

    // DetailLoader initially shows loading, then our stubbed AnalysisDetail with symbol
    await waitFor(() => expect(screen.getByTestId('analysis-detail').textContent).toContain('BTCUSD'));

    // clicking create should call the onCreateTrade handler (no-op in this test)
    fireEvent.click(screen.getByText('create'));

    // clicking delete should open confirm dialog (we expect dialog title to be present)
    fireEvent.click(screen.getByText('delete'));
    await waitFor(() => expect(screen.getByText('Delete analysis')).toBeTruthy());
  });
});
