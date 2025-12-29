import React from 'react';
import styles from './StatusBadge.module.css';

export type StatusValue = 'OPEN' | 'CLOSED' | 'FILLED';

export type StatusBadgeProps = {
  value: StatusValue;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
};

export function StatusBadge({ value, className = '', onClick }: StatusBadgeProps) {
  const cls =
    value === 'OPEN'
      ? styles.statusOpen
      : value === 'FILLED'
      ? styles.statusFilled
      : styles.statusClosed;
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onClick) onClick(e as unknown as React.MouseEvent<HTMLSpanElement>);
        }
      }}
      className={`${cls} ${className}`}
    >
      {value}
    </span>
  );
}
