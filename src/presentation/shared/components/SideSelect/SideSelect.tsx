import React from 'react'
import styles from './SideSelect.module.css'
import inputStyles from '@/presentation/shared/components/Input/Input.module.css'

export type SideValue = 'LONG' | 'SHORT'

export type SideSelectProps = {
  value: SideValue
  onChange: (value: SideValue) => void
  ariaLabel?: string
  showBadge?: boolean
  compact?: boolean
  onBlur?: (event: React.FocusEvent<HTMLSelectElement>) => void
  colored?: boolean
  label?: string
  hasError?: boolean
  ariaDescribedBy?: string
}

export function SideSelect({ value, onChange, ariaLabel, showBadge = false, compact = false, onBlur, colored = false, label, hasError = false, ariaDescribedBy }: SideSelectProps) {
  const baseClass = compact ? `${styles.select} ${styles.selectCompact}` : styles.select
  const coloredClass = colored ? (value === 'LONG' ? `${baseClass} ${styles.colored} ${styles.coloredLong}` : `${baseClass} ${styles.colored} ${styles.coloredShort}`) : baseClass
  const selectClass = `${coloredClass} ${hasError ? styles.error : ''}`.trim()

  const control = (
    <div className={styles.container}>
      <select
        className={selectClass}
        value={value}
        onChange={e => onChange(e.target.value as SideValue)}
        onBlur={onBlur}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      >
        <option value="LONG">LONG</option>
        <option value="SHORT">SHORT</option>
      </select>
      {showBadge && (
        <span className={`${styles.badge} ${value === 'LONG' ? styles.badgeLong : styles.badgeShort}`} aria-hidden>
          {value}
        </span>
      )}
    </div>
  )

  if (label) {
    return (
      <label className={inputStyles.wrapper}>
        <span className={inputStyles.label}>{label}</span>
        {control}
      </label>
    )
  }

  return control
}

export type SideBadgeProps = {
  value: SideValue
  className?: string
  onClick?: (e: React.MouseEvent) => void
}

export function SideBadge({ value, className = '', onClick }: SideBadgeProps) {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick && onClick(e as any) } }}
      className={`${styles.badge} ${value === 'LONG' ? styles.badgeLong : styles.badgeShort} ${className}`}
    >
      {value}
    </span>
  )
}
