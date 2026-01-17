import React, { useRef } from 'react';
import styles from './ActionDropdown.module.css';

export type ActionDropdownOption = {
  value: string;
  label: string;
  onSelect: () => void;
};

type Props = {
  options: ActionDropdownOption[];
  placeholder?: string;
  ariaLabel: string;
  size?: 'default' | 'compact';
};

export function ActionDropdown({
  options,
  placeholder = 'Action',
  ariaLabel,
  size = 'default',
}: Props) {
  const selectRef = useRef<HTMLSelectElement | null>(null);

  if (!options.length) {
    return null;
  }

  const className = [styles.select, size === 'compact' ? styles.compact : '']
    .filter(Boolean)
    .join(' ');

  return (
    <select
      ref={selectRef}
      className={className}
      aria-label={ariaLabel}
      defaultValue=""
      onChange={(event) => {
        const nextValue = event.target.value;
        if (!nextValue) {
          return;
        }
        const option = options.find((opt) => opt.value === nextValue);
        option?.onSelect();
        if (selectRef.current) {
          selectRef.current.value = '';
        }
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
