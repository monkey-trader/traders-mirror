import React from 'react';
import styles from './Textarea.module.css';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hasError?: boolean;
  // optional ref for the underlying textarea
  inputRef?: React.Ref<HTMLTextAreaElement>;
};

export function Textarea({ label, className = '', hasError = false, inputRef, ...rest }: TextareaProps) {
  const cls = [styles.textarea, hasError ? styles.textareaError : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <label className={styles.wrapper}>
      {label && <span className={styles.label}>{label}</span>}
      <textarea ref={inputRef} className={cls} {...rest} />
    </label>
  );
}
