import React from 'react'
// Use a lightweight presentation DTO here (avoid coupling to domain TradeInput)
export type TradeListItem = {
  id: string
  symbol: string
  entryDate: string
  size: number
  price: number
  side: string
  status?: string
  notes?: string
}

import styles from './TradeList.module.css'

export type TradeListProps = {
  trades: TradeListItem[]
  selectedId?: string | null
  onSelect: (id: string) => void
}

export function TradeList({ trades, selectedId, onSelect }: TradeListProps) {
  return (
    <div className={styles.list} role="list">
      {trades.map((t) => {
        const isSelected = selectedId === t.id

        // normalize side value to a predictable key and restrict to only 'long' or 'short'
        const rawSide = (t.side || '').toString().trim().toLowerCase()
        const sideKey = rawSide === 'long' || rawSide === 'buy' ? 'long' : 'short'

        const sideClass = sideKey === 'long' ? styles.sideLong : styles.sideShort

        return (
          <button
            key={t.id}
            className={[styles.item, isSelected ? styles.selected : ''].filter(Boolean).join(' ')}
            onClick={() => onSelect(t.id)}
            role="listitem"
            aria-pressed={isSelected}
          >
            <div className={styles.rowLeft}>
              <div className={styles.symbol}>{t.symbol}</div>
              <div className={styles.meta}>{new Date(t.entryDate).toLocaleDateString()}</div>
            </div>
            <div className={styles.rowRight}>
              <div className={[styles.side, sideClass].join(' ')} aria-label={`Side: ${sideKey}`} title={sideKey}>
                {sideKey.toUpperCase()}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
