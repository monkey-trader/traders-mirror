import React from 'react';
import { Button } from '@/presentation/shared/components/Button/Button';
import styles from './IconButton.module.css';

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  ariaLabel: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /**
   * Color can be a CSS color string or semantic token like 'primary'.
   * When set to 'primary' it resolves to the theme variable `--color-primary`.
   */
  color?: 'primary' | string;
  icon?: React.ReactNode;
};

export function IconButton({
  ariaLabel,
  variant = 'ghost',
  color,
  icon,
  className = '',
  children,
  ...rest
}: IconButtonProps) {
  const cls = [className].filter(Boolean).join(' ');

  // If caller didn't provide a `color`, map `variant='primary'` -> semantic 'primary'
  const effectiveColor = color ?? (variant === 'primary' ? 'primary' : undefined);

  // Resolve semantic color tokens to CSS variables
  const resolvedColor = effectiveColor === 'primary' ? 'var(--color-primary)' : effectiveColor;

  // Merge provided style with resolved color so child SVGs using currentColor inherit
  const mergedStyle = { ...(rest.style as React.CSSProperties), ...(resolvedColor ? { color: resolvedColor } : {}) };

  return (
    <Button aria-label={ariaLabel} variant={variant} className={`${styles.iconBtn} ${cls}`} {...rest} style={mergedStyle}>
      <span className={styles.inner} aria-hidden>
        {icon ?? children}
      </span>
    </Button>
  );
}

export default IconButton;
