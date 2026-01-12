import React, { useEffect, useState } from 'react';
import styles from './RepoSyncStatus.module.css';

type SyncStatus = 'local' | 'online' | 'queued';

type RepoSyncEventDetail = {
  feature: 'trade' | 'analysis';
  status: SyncStatus;
  queuedCount?: number;
};

function pickOverallStatus(
  statuses: Record<string, { status: SyncStatus; queuedCount?: number }>
): {
  status: SyncStatus;
  queuedCount?: number;
} {
  // Priority: queued > online > local
  let queuedTotal = 0;
  let anyOnline = false;
  let anyLocal = false;
  Object.values(statuses).forEach((s) => {
    if (s.status === 'queued') queuedTotal += s.queuedCount || 1;
    if (s.status === 'online') anyOnline = true;
    if (s.status === 'local') anyLocal = true;
  });
  if (queuedTotal > 0) return { status: 'queued', queuedCount: queuedTotal };
  if (anyOnline) return { status: 'online' };
  // default to local if nothing else
  return { status: anyLocal ? 'local' : 'local' };
}

export type RepoSyncStatusProps = { compactView?: boolean };

export function RepoSyncStatus({ compactView }: RepoSyncStatusProps) {
  const [statuses, setStatuses] = useState<
    Record<string, { status: SyncStatus; queuedCount?: number }>
  >({});
  const overall = pickOverallStatus(statuses);

  useEffect(() => {
    function onStatus(e: Event) {
      const ce = e as CustomEvent<RepoSyncEventDetail>;
      const { feature, status, queuedCount } = ce.detail || {};
      if (!feature || !status) return;
      setStatuses((prev) => ({ ...prev, [feature]: { status, queuedCount } }));
    }
    globalThis.addEventListener('repo-sync-status', onStatus as EventListener);
    return () => {
      globalThis.removeEventListener('repo-sync-status', onStatus as EventListener);
    };
  }, []);

  const label =
    overall.status === 'queued'
      ? `Sync: Queued ${overall.queuedCount ?? ''}`.trim()
      : overall.status === 'online'
      ? 'Sync: Online'
      : 'Sync: Local';

  const base = compactView ? `${styles.chip} ${styles.compact}` : styles.chip;
  const cls =
    overall.status === 'queued'
      ? `${base} ${styles.chipQueued}`
      : overall.status === 'online'
      ? `${base} ${styles.chipOnline}`
      : `${base} ${styles.chipLocal}`;

  return (
    <span className={cls} aria-live="polite">
      {label}
    </span>
  );
}

export default RepoSyncStatus;
