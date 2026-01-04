import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AnalysisDetail } from '@/presentation/analysis/AnalysisDetail'
import type { AnalysisDTO } from '@/domain/analysis/interfaces/AnalysisRepository'
import LocalStorageTradeRepository from '@/infrastructure/trade/repositories/LocalStorageTradeRepository'

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
})

describe('AnalysisDetail', () => {
  beforeEach(() => {
    window.location.hash = ''
  })

  afterEach(() => {
    try {
      vi.useRealTimers()
    } catch {
      // ignore
    }
  })

  it('renders symbol, notes and timeframes', () => {
    const a = makeAnalysis()
    render(<AnalysisDetail analysis={a} />)

    expect(screen.getByText('BTCUSD')).toBeInTheDocument()
    expect(screen.getByText('some notes')).toBeInTheDocument()
    expect(screen.getByLabelText('Open TradingView link')).toBeInTheDocument()
    expect(screen.getByText('monthly note')).toBeInTheDocument()
  })

  it('calls onCreateTrade when Create Trade clicked', () => {
    const a = makeAnalysis()
    const onCreate = vi.fn()
    render(<AnalysisDetail analysis={a} onCreateTrade={onCreate} />)

    fireEvent.click(screen.getByText('Create Trade'))
    expect(onCreate).toHaveBeenCalledWith('a1')
  })

  it('respects compactView and renders all timeframe rows', () => {
    const a = makeAnalysis()
    render(<AnalysisDetail analysis={a} compactView />)
    expect(screen.getByText('MONTHLY')).toBeInTheDocument()
    expect(screen.getByText('WEEKLY')).toBeInTheDocument()
    expect(screen.getByText('DAILY')).toBeInTheDocument()
  })

  it('calls onCreateTrade with analysis id', () => {
    const onCreate = vi.fn()
    const sample = makeAnalysis({ id: 'a-1', symbol: 'XYZ' })
    const { getByText } = render(
      <AnalysisDetail analysis={sample} onCreateTrade={onCreate} />
    )

    const btn = getByText('Create Trade')
    fireEvent.click(btn)
    expect(onCreate).toHaveBeenCalledWith(sample.id)
  })

  it('does not show Open trade button when no linked trade exists', () => {
    const sample = makeAnalysis({ symbol: 'XYZ' })
    const { queryByLabelText } = render(<AnalysisDetail analysis={sample} />)

    expect(queryByLabelText(`Open trade for ${sample.symbol}`)).toBeNull()
  })

  it('calls onRequestDelete when Delete button is clicked', () => {
    const onReq = vi.fn()
    const sample = makeAnalysis()
    const { getByText } = render(
      <AnalysisDetail analysis={sample} onRequestDelete={onReq} />
    )

    const del = getByText('Delete')
    fireEvent.click(del)
    expect(onReq).toHaveBeenCalledWith(sample.id)
  })
})
