import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { AnalysisDetail } from '@/presentation/analysis/AnalysisDetail'
import type { AnalysisDTO } from '@/domain/analysis/interfaces/AnalysisRepository'

const makeAnalysis = (overrides: Partial<AnalysisDTO> = {}): AnalysisDTO => ({
  id: 'a1',
  symbol: 'BTCUSD',
  createdAt: new Date().toISOString(),
  timeframes: {
    monthly: { timeframe: 'monthly', tradingViewLink: 'https://tv.example/1', note: 'monthly note' },
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
  it('renders symbol, notes and timeframes', () => {
    const a = makeAnalysis()
    render(<AnalysisDetail analysis={a} />)

    expect(screen.getByText('BTCUSD')).toBeInTheDocument()
    expect(screen.getByText('some notes')).toBeInTheDocument()
    // TV link should be present for monthly
    expect(screen.getByText('TV')).toBeInTheDocument()
    // timeframe note should be shown
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
    // verify timeframe labels are present
    expect(screen.getByText('MONTHLY')).toBeInTheDocument()
    expect(screen.getByText('WEEKLY')).toBeInTheDocument()
    expect(screen.getByText('DAILY')).toBeInTheDocument()
  })
})

export {}
