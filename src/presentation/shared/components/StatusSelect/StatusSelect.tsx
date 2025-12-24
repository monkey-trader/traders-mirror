import React from 'react'
import styles from './StatusSelect.module.css'

export type StatusValue = 'OPEN' | 'CLOSED' | 'FILLED'

export type StatusSelectProps = {
  value: StatusValue
  onChange: (value: StatusValue) => void
  ariaLabel?: string
  compact?: boolean
  colored?: boolean
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void
  autoFocus?: boolean
}

export function StatusSelect({ value, onChange, ariaLabel, compact = false, colored = true, onBlur, autoFocus = false }: StatusSelectProps) {
  const baseClass = compact ? `${styles.select} ${styles.selectCompact}` : styles.select
  const coloredClass = colored
    ? value === 'OPEN'
      ? `${baseClass} ${styles.colored} ${styles.coloredOpen}`
      : value === 'CLOSED'
      ? `${baseClass} ${styles.colored} ${styles.coloredClosed}`
      : `${baseClass} ${styles.colored} ${styles.coloredFilled}`
    : baseClass

  return (
    <select
      className={coloredClass}
      value={value}
      onChange={e => onChange(e.target.value as StatusValue)}
      aria-label={ariaLabel}
      onBlur={onBlur}
      autoFocus={autoFocus}
    >
      <option value="OPEN">OPEN</option>
      <option value="CLOSED">CLOSED</option>
      <option value="FILLED">FILLED</option>
    </select>
  )
}
