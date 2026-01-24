import React from 'react';
import styles from './TagToggle.module.css';

export type TagToggleProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function TagToggle({ label, checked, onChange, disabled, className }: TagToggleProps) {
  return (
    <button
      type="button"
      className={[
        styles.tag,
        checked ? styles.active : '',
        disabled ? styles.disabled : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={checked}
      aria-label={label}
      disabled={disabled}
      tabIndex={0}
      onClick={() => !disabled && onChange(!checked)}
    >
      <span className={styles.label}>{label}</span>
    </button>
  );
}

export default TagToggle;
