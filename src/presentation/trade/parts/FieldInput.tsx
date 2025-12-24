import React from 'react'
import styles from './FieldInput.module.css'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  icon?: React.ReactNode
}

export function FieldInput({ label, icon, ...rest }: Props) {
  return (
    <label className={styles.field}>
      {label && <div className={styles.labelText}>{label}</div>}
      <div className={styles.inputRow}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <input className={styles.input} {...rest} />
      </div>
    </label>
  )
}

export default FieldInput

