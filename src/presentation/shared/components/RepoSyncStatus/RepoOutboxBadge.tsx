import React, { useEffect, useState } from 'react';
import styles from './RepoOutboxBadge.module.css';

export function RepoOutboxBadge() {
  const [queued, setQueued] = useState(0);
  const mapRef = React.useRef<Record<string, number>>({});

  useEffect(() => {
    function onStatus(e: Event) {
      const ce = e as CustomEvent<{ feature?: string; status?: string; queuedCount?: number }>;
      const detail = ce.detail || {};
      if (detail.feature) {
        mapRef.current[detail.feature] =
          detail.queuedCount && detail.queuedCount > 0 ? detail.queuedCount : 0;
      }
      const total = Object.values(mapRef.current).reduce((s, v) => s + (v || 0), 0);
      setQueued(total);
    }
    globalThis.addEventListener('repo-sync-status', onStatus as EventListener);
    return () => globalThis.removeEventListener('repo-sync-status', onStatus as EventListener);
  }, []);

  if (!queued) return null;
  return (
    <div
      className={styles.outbox}
      role="status"
      title={`Outbox: ${queued} pending`}
      aria-live="polite"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M3 7h18M3 7l3 13h12l3-13"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 3v4M8 3v4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={styles.count}>{queued}</span>
    </div>
  );
}

export default RepoOutboxBadge;
