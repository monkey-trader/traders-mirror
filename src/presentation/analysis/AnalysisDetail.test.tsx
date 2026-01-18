import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnalysisDetail } from '@/presentation/analysis/AnalysisDetail';
import type { AnalysisDTO } from '@/domain/analysis/interfaces/AnalysisRepository';

const makeAnalysis = (overrides: Partial<AnalysisDTO> = {}): AnalysisDTO => ({
  id: 'a1',
  symbol: 'BTCUSD',
  createdAt: new Date().toISOString(),
  timeframes: {
    monthly: {
      timeframe: 'monthly',
      tradingViewLink: 'https://tv.example/1',
      note: 'monthly note',
    },
    weekly: { timeframe: 'weekly' },
    daily: { timeframe: 'daily', note: 'daily note' },
    '4h': { timeframe: '4h' },
    '2h': { timeframe: '2h' },
    '1h': { timeframe: '1h' },
    '15min': { timeframe: '15min' },
  },
  notes: 'some notes',
  ...overrides,
});

describe('AnalysisDetail', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  afterEach(() => {
    try {
      vi.useRealTimers();
    } catch {
      // ignore
    }
  });

  it('renders symbol, notes and timeframes', () => {
    const a = makeAnalysis();
    render(<AnalysisDetail analysis={a} />);

    expect(screen.getByText('BTCUSD')).toBeInTheDocument();
    expect(screen.getByText('some notes')).toBeInTheDocument();
    expect(screen.getByLabelText('Open TradingView link')).toBeInTheDocument();
    expect(screen.getByText('monthly note')).toBeInTheDocument();
  });

  it('respects compactView and renders all timeframe rows', () => {
    const a = makeAnalysis();
    render(<AnalysisDetail analysis={a} compactView />);
    expect(screen.getByText('MONTHLY')).toBeInTheDocument();
    expect(screen.getByText('WEEKLY')).toBeInTheDocument();
    expect(screen.getByText('DAILY')).toBeInTheDocument();
  });

  it('does not show Open trade button when no linked trade exists', () => {
    const sample = makeAnalysis({ symbol: 'XYZ' });
    const { queryByLabelText } = render(<AnalysisDetail analysis={sample} />);

    expect(queryByLabelText(`Open trade for ${sample.symbol}`)).toBeNull();
  });

  it('omits legacy action buttons even when handlers provided', () => {
    const a = makeAnalysis();
    const onCreate = vi.fn();
    const onDelete = vi.fn();
    render(
      // @ts-expect-error legacy props intentionally ignored
      <AnalysisDetail analysis={a} onCreateTrade={onCreate} onRequestDelete={onDelete} />
    );

    expect(screen.queryByText('Create Trade')).toBeNull();
    expect(screen.queryByText('Delete')).toBeNull();
    expect(onCreate).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });
});
