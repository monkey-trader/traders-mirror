import React from 'react'
import styles from './Input.module.css'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
}

export function Input({ label, className = '', ...rest }: InputProps) {
  return (
    <label className={styles.wrapper}>
      {label && <span className={styles.label}>{label}</span>}
      <input className={[styles.input, className].filter(Boolean).join(' ')} {...rest} />
    </label>
  )
}

