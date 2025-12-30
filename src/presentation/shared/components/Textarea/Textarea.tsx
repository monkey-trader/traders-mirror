import React from 'react';
import styles from './Textarea.module.css';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hasError?: boolean;
};

export function Textarea({ label, className = '', hasError = false, ...rest }: TextareaProps) {
  const cls = [styles.textarea, hasError ? styles.textareaError : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <label className={styles.wrapper}>
      {label && <span className={styles.label}>{label}</span>}
      <textarea className={cls} {...rest} />
    </label>
  );
}
