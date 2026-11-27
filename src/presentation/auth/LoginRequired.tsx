import React from 'react';
import styles from './LoginRequired.module.css';
import { useAuth } from './AuthProvider';

export type LoginRequiredProps = {
  loading?: boolean;
};

export function LoginRequired({ loading = false }: LoginRequiredProps) {
  const { signIn, loading: ctxLoading } = useAuth();
  const isLoading = loading || ctxLoading;
  return (
    <div className={styles.container}>
      <div className={styles.card} role="region" aria-label="Login required">
        <h2 className={styles.title}>Bitte anmelden</h2>
        <p className={styles.text}>
          Um diese Seite zu nutzen, melde dich mit deinem Google‑Account an.
        </p>
        <button
          type="button"
          className={styles.btn}
          onClick={() => void signIn()}
          disabled={isLoading}
        >
          {isLoading ? 'Anmelden…' : 'Login mit Google'}
        </button>
      </div>
    </div>
  );
}
