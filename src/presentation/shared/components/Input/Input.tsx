import React from 'react';
import styles from './Input.module.css';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hasError?: boolean;
  // optional ref for the underlying input element
  inputRef?: React.Ref<HTMLInputElement>;
};

export function Input({ label, className = '', hasError = false, inputRef, ...rest }: InputProps) {
  const cls = [styles.input, hasError ? styles.inputError : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <label className={styles.wrapper}>
      {label && <span className={styles.label}>{label}</span>}
      <input ref={inputRef} className={cls} {...rest} />
    </label>
  );
}
