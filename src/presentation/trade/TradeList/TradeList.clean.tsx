import React from 'react'

export type TradeListItem = {
  id: string
  symbol: string
  entryDate: string
  size: number
  price: number
  side: string
  tp1?: number
  tp2?: number
  tp3?: number
  tp4?: number
  sl?: number
  pnl?: number
}

export type TradeListProps = {
  trades: TradeListItem[]
  compactView?: boolean
  onSelect: (id: string, focusField?: string) => void
}

export function TradeList({ trades, compactView = false, onSelect }: TradeListProps) {
  if (compactView) {
    return (
      <div>
        {trades.map((t) => (
          <div key={t.id} onClick={() => onSelect(t.id)}>
            <strong>{t.symbol}</strong> — Price: {t.price ?? '-'} • Size: {t.size}
            {' '}• SL: {t.sl ?? '-'}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {trades.map((t) => (
        <div key={t.id} onClick={() => onSelect(t.id)}>
          <div>{t.symbol}</div>
          <div>Entry: {t.entryDate}</div>
          <div>Price: {t.price ?? '-'} • Size: {t.size} • SL: {t.sl ?? '-'}</div>
        </div>
      ))}
    </div>
  )
}

export default TradeList
