import React, { useRef } from 'react';
import styles from './ActionDropdown.module.css';

export type ActionDropdownOption = {
  value: string;
  label: string;
  onSelect: () => void;
  variant?: 'success';
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

  const variantClassMap: Record<NonNullable<ActionDropdownOption['variant']>, string> = {
    success: styles.optionSuccess,
  };

  const className = [styles.select, size === 'compact' ? styles.compact : '']
    .filter(Boolean)
    .join(' ');

  return (
    <select
      ref={selectRef}
      className={className}
      aria-label={ariaLabel}
      defaultValue=""
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onChange={(event) => {
        event.stopPropagation();
        const nextValue = (event.target as HTMLSelectElement).value;
        if (!nextValue) {
          return;
        }
        const option = options.find((opt) => opt.value === nextValue);
        if (option) {
          // Call the handler synchronously so tests and immediate consumers
          // observe the action right away. Reset the select value asynchronously
          // to avoid interfering with native select focus/close behavior.
          // eslint-disable-next-line no-console
          console.debug('[ActionDropdown] selected', nextValue);
          try {
            option.onSelect();
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('ActionDropdown option handler threw', err);
          }
          setTimeout(() => {
            if (selectRef.current) {
              selectRef.current.value = '';
            }
          }, 0);
        }
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className={option.variant ? variantClassMap[option.variant] : undefined}
          data-variant={option.variant ?? undefined}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}
