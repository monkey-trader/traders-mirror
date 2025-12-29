import React from 'react';
import styles from './StatusSelect.module.css';
import inputStyles from '@/presentation/shared/components/Input/Input.module.css';

export type StatusValue = 'OPEN' | 'CLOSED' | 'FILLED';

export type StatusSelectProps = {
  value: StatusValue;
  onChange: (value: StatusValue) => void;
  ariaLabel?: string;
  compact?: boolean;
  colored?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  autoFocus?: boolean;
  label?: string;
  hasError?: boolean;
  ariaDescribedBy?: string;
};

export function StatusSelect({
  value,
  onChange,
  ariaLabel,
  compact = false,
  colored = true,
  onBlur,
  autoFocus = false,
  label,
  hasError = false,
  ariaDescribedBy,
}: StatusSelectProps) {
  const baseClass = compact ? `${styles.select} ${styles.selectCompact}` : styles.select;
  const coloredClass = colored
    ? value === 'OPEN'
      ? `${baseClass} ${styles.colored} ${styles.coloredOpen}`
      : value === 'CLOSED'
      ? `${baseClass} ${styles.colored} ${styles.coloredClosed}`
      : `${baseClass} ${styles.colored} ${styles.coloredFilled}`
    : baseClass;

  const selectClass = `${coloredClass} ${hasError ? styles.error : ''}`.trim();

  const control = (
    <select
      className={selectClass}
      value={value}
      onChange={(e) => {
        const v = e.target.value as StatusValue;
        onChange(v);
        // blur immediately after selection so parent onBlur handlers run and edit mode is closed reliably
        try {
          (e.currentTarget as HTMLSelectElement).blur();
        } catch {
          /* ignore */
        }
      }}
      aria-label={ariaLabel}
      onBlur={onBlur}
      autoFocus={autoFocus}
      aria-describedby={ariaDescribedBy}
    >
      <option value="OPEN">OPEN</option>
      <option value="CLOSED">CLOSED</option>
      <option value="FILLED">FILLED</option>
    </select>
  );

  if (label) {
    return (
      <label className={inputStyles.wrapper}>
        <span className={inputStyles.label}>{label}</span>
        {control}
      </label>
    );
  }

  return control;
}
