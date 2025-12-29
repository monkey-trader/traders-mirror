import React from 'react';
import styles from './Input.module.css';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hasError?: boolean;
};

export function Input({ label, className = '', hasError = false, ...rest }: InputProps) {
  const cls = [styles.input, hasError ? styles.inputError : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <label className={styles.wrapper}>
      {label && <span className={styles.label}>{label}</span>}
      <input className={cls} {...rest} />
    </label>
  );
}
