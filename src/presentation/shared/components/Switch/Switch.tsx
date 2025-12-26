import React from 'react'
import styles from './Switch.module.css'

export type SwitchProps = {
  checked: boolean
  onChange: (v: boolean) => void
  id?: string
  label?: string
  ariaLabel?: string
}

export function Switch({ checked, onChange, id, label, ariaLabel }: SwitchProps) {
  return (
    <div className={styles.wrapper}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        className={`${styles.switch} ${checked ? styles.on : styles.off}`}
        onClick={() => onChange(!checked)}
        type="button"
      >
        <span className={styles.knob} aria-hidden />
      </button>
    </div>
  )
}

