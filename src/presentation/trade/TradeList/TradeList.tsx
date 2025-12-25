import React from 'react'
// Use a lightweight presentation DTO here (avoid coupling to domain TradeInput)
export type TradeListItem = {
  id: string
  symbol: string
  entryDate: string
  size: number
  price: number
  side: string
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
              <div className={styles.side}>{t.side}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
