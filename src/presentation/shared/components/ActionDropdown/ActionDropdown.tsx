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
          // call handler asynchronously to avoid native select close/focus side-effects
          // that can interfere with parent click handlers or portal modals
          // small log for debugging in case users still can't trigger actions
          // eslint-disable-next-line no-console
          console.debug('[ActionDropdown] selected', nextValue);
          setTimeout(() => {
            try {
              option.onSelect();
            } catch (err) {
              // eslint-disable-next-line no-console
              console.warn('ActionDropdown option handler threw', err);
            }
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
