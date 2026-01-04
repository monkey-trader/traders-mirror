import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TradeList } from './TradeList'
import type { TradeListItem } from './TradeList'

const sampleTrade: TradeListItem = {
  id: 't1',
  symbol: 'ABC',
  entryDate: new Date().toISOString(),
  size: 1,
  price: 1,
  side: 'LONG',
  analysisId: 'a1',
}

describe('TradeList deep-link and keyboard', () => {
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

  it('clicking analysis button updates hash and dispatches open-analysis event', () => {
    vi.useFakeTimers()
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    const { getByLabelText } = render(<TradeList trades={[sampleTrade]} onSelect={() => {}} />)

    const btn = getByLabelText(`Open analysis for ${sampleTrade.symbol}`)
    fireEvent.click(btn)

    expect(window.location.hash).toContain(`#/analysis?id=${encodeURIComponent(sampleTrade.analysisId!)}`)

    // fast-forward the timeout used to dispatch the event
    vi.runAllTimers()
    expect(dispatchSpy).toHaveBeenCalled()
  })

  it('pressing Enter on a row calls onSelect with the trade id', () => {
    const onSelect = vi.fn()
    const { getByLabelText } = render(<TradeList trades={[sampleTrade]} onSelect={onSelect} />)
    const row = getByLabelText(`Select ${sampleTrade.symbol}`)
    fireEvent.keyDown(row, { key: 'Enter', code: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith(sampleTrade.id)
  })
})
