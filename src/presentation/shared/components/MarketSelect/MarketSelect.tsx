import React from 'react'
import styles from './MarketSelect.module.css'

export type MarketValue = 'All' | 'Forex' | 'Crypto'

export type MarketSelectProps = {
  value: MarketValue
  onChange: (v: MarketValue) => void
  compact?: boolean
  showAll?: boolean // when false, do not render the 'All' option (useful for New Trade form)
}

export function MarketSelect({ value, onChange, compact = false, showAll = true }: MarketSelectProps) {
  const options = (showAll ? ['All', 'Forex', 'Crypto'] : ['Forex', 'Crypto']) as MarketValue[]

  return (
    <div className={styles.container} role="tablist" aria-label="Market select">
      {options.map(m => (
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
