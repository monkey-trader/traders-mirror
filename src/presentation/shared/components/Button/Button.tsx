import React from 'react';
import styles from './Button.module.css';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
};

export function Button({
  variant = 'primary',
  children,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  const cls = [styles.button, styles[variant], className].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}
