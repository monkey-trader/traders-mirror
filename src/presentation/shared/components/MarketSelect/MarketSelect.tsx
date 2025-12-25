import React from 'react'
import styles from './MarketSelect.module.css'

export type MarketValue = 'All' | 'Forex' | 'Crypto'

export type MarketSelectProps = {
  value: MarketValue
  onChange: (v: MarketValue) => void
  compact?: boolean
}

export function MarketSelect({ value, onChange, compact = false }: MarketSelectProps) {
  return (
    <div className={styles.container} role="tablist" aria-label="Market select">
      {(['All', 'Forex', 'Crypto'] as MarketValue[]).map(m => (
        <button
          key={m}
          role="tab"
          aria-selected={value === m}
          className={`${styles.badge} ${value === m ? styles.active : ''} ${compact ? styles.compact : ''}`}
          onClick={() => onChange(m)}
        >
          {m}
        </button>
      ))}
    </div>
  )
}

export default MarketSelect

