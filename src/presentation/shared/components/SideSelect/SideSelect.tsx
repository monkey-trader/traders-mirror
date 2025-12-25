import React from 'react'
import styles from './SideSelect.module.css'

export type SideValue = 'LONG' | 'SHORT'

export type SideSelectProps = {
  value: SideValue
  onChange: (value: SideValue) => void
  ariaLabel?: string
  showBadge?: boolean
  compact?: boolean
  onBlur?: (event: React.FocusEvent<HTMLSelectElement>) => void
  colored?: boolean
}

export function SideSelect({ value, onChange, ariaLabel, showBadge = false, compact = false, onBlur, colored = false }: SideSelectProps) {
  const baseClass = compact ? `${styles.select} ${styles.selectCompact}` : styles.select
  const coloredClass = colored ? (value === 'LONG' ? `${baseClass} ${styles.colored} ${styles.coloredLong}` : `${baseClass} ${styles.colored} ${styles.coloredShort}`) : baseClass

  return (
    <div className={styles.container}>
      <select
        className={coloredClass}
        value={value}
        onChange={e => onChange(e.target.value as SideValue)}
        onBlur={onBlur}
        aria-label={ariaLabel}
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
