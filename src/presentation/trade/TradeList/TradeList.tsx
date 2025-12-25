import React from 'react'
import type { TradeInput } from '@/domain/trade/entities/TradeFactory'
import styles from './TradeList.module.css'

export type TradeListProps = {
  trades: TradeInput[]
  selectedId?: string | null
  dirtyIds?: Set<string>
  onSelect: (id: string) => void
}

export function TradeList({ trades, selectedId, dirtyIds = new Set(), onSelect }: TradeListProps) {
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
              {dirtyIds.has(t.id) && <div className={styles.dirtyDot} aria-hidden />}
            </div>
          </button>
        )
      })}
    </div>
  )
}

