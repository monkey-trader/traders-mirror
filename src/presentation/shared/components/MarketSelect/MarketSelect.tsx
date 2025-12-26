import React from 'react'
import styles from './MarketSelect.module.css'
import inputStyles from '@/presentation/shared/components/Input/Input.module.css'

export type MarketValue = '' | 'All' | 'Forex' | 'Crypto'

export type MarketSelectProps = {
  value: MarketValue
  onChange: (v: MarketValue) => void
  compact?: boolean
  showAll?: boolean // when false, do not render the 'All' option (useful for New Trade form)
  label?: string
  hasError?: boolean
  ariaDescribedBy?: string
}

export function MarketSelect({ value, onChange, compact = false, showAll = true, label, hasError = false, ariaDescribedBy }: MarketSelectProps) {
  const options = (showAll ? ['All', 'Forex', 'Crypto'] : ['Forex', 'Crypto']) as Exclude<MarketValue, ''>[]

  const container = (
    <div
      className={`${styles.container} ${hasError ? styles.error : ''}`}
      role="tablist"
      aria-label="Market select"
      aria-describedby={ariaDescribedBy}
    >
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

  // If a label was provided, render the input-like wrapper so consumers don't need to wrap it manually
  if (label) {
    return (
      <label className={inputStyles.wrapper}>
        <span className={inputStyles.label}>{label}</span>
        {container}
      </label>
    )
  }

  return container
}

export default MarketSelect
