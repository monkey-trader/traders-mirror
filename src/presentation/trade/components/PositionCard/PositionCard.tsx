import React from 'react'
import styles from './PositionCard.module.css'

export type PositionCardProps = {
  id: string
  symbol: string
  side: 'LONG' | 'SHORT'
  size: number
  entry?: string
  sl?: string
  pnl: number
  onExpand?: (id: string) => void
  onToggleSide?: (id: string) => void
  onClose?: (id: string) => void
  onSetSLtoBE?: (id: string) => void
  onSetSLHit?: (id: string) => void
}

export function PositionCard({ id, symbol, side, size, entry, sl, pnl, onExpand, onToggleSide, onClose, onSetSLtoBE, onSetSLHit }: PositionCardProps) {
  return (
    <div className={styles.card} role="group" aria-labelledby={`pos-${id}-symbol`}>
      <div className={styles.left}>
        <div id={`pos-${id}-symbol`} className={styles.symbol}>{symbol}</div>
        <div className={styles.meta}>{side} · {size}</div>
        {entry && <div className={styles.small}>Entry: {entry}</div>}
        {sl && <div className={styles.small}>SL: {sl}</div>}
      </div>
      <div className={styles.right}>
        <div className={pnl >= 0 ? styles.pnlPositive : styles.pnlNegative}>{pnl.toFixed(2)}</div>
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={() => onToggleSide?.(id)} aria-label={`Toggle side for ${symbol}`}>Side</button>
          <button className={styles.actionBtn} onClick={() => onSetSLtoBE?.(id)} aria-label={`Set SL to BE for ${symbol}`}>SL‑BE</button>
          <button className={styles.actionBtn} onClick={() => onSetSLHit?.(id)} aria-label={`Set SL hit for ${symbol}`}>SL‑HIT</button>
          <button className={styles.closeBtn} onClick={() => onClose?.(id)} aria-label={`Close ${symbol}`}>Close</button>
          <button className={styles.expandBtn} onClick={() => onExpand?.(id)} aria-label={`Toggle details for ${symbol}`}>▸</button>
        </div>
      </div>
    </div>
  )
}
