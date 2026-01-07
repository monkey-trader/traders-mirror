import React from 'react';
import styles from './UserBadge.module.css';
import { useAuth } from './AuthProvider';
import { Button } from '@/presentation/shared/components/Button/Button';

function getInitials(nameOrEmail: string | null): string {
  if (!nameOrEmail) return '?';
  const cleaned = nameOrEmail.trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return cleaned[0]?.toUpperCase() ?? '?';
}

export const UserBadge: React.FC<{ compactView?: boolean }> = ({ compactView = false }) => {
  const { user, signOut, loading } = useAuth();
  if (!user) return null;

  const display = user.displayName || user.email || 'User';
  const initials = getInitials(display);

  return (
    <div className={styles.badge} aria-label="User account">
      <span className={styles.avatar} aria-hidden>
        {user.photoURL ? (
          <img src={user.photoURL} width={28} height={28} alt={display || 'avatar'} />
        ) : (
          initials
        )}
      </span>
      {!compactView && <span className={styles.name}>{display}</span>}
      <div className={styles.actions}>
        <Button variant="secondary" onClick={signOut} disabled={loading} aria-label="Logout">
          Logout
        </Button>
      </div>
    </div>
  );
};
