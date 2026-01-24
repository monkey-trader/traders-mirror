import React, { useEffect, useRef, useState } from 'react';
import styles from './RepoSyncStatus.module.css';
import { useToast } from '@/presentation/shared/components/Toast/ToastProvider';

type SyncStatus = 'local' | 'online' | 'queued';

export type RepoSyncEventDetail = {
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
  const [syncing, setSyncing] = useState(false);
  const overall = pickOverallStatus(statuses);
  const { addToast } = useToast();
  const timeoutRef = useRef<number | null>(null);

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

  // Watch for overall status changes to infer success when a forced sync completes
  useEffect(() => {
    if (!syncing) return;
    // success if online and no queued items
    if (overall.status === 'online' && !(overall.queuedCount && overall.queuedCount > 0)) {
      addToast('Sync completed', 'success');
      setSyncing(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [overall, syncing, addToast]);

  const label = syncing
    ? 'Syncing…'
    : overall.status === 'queued'
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

  // Dispatch a global event to request flushing outboxes in hybrid repos
  const doForceSync = () => {
    try {
      setSyncing(true);
      addToast('Sync started', 'info');
      globalThis.dispatchEvent(new CustomEvent('repo-sync-force'));
      // clear transient syncing indicator after timeout if not completed
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        if (syncing) {
          addToast('Sync timed out', 'error');
          setSyncing(false);
        }
        timeoutRef.current = null;
      }, 10000);
    } catch {
      setSyncing(false);
    }
  };

  return (
    <span
      className={cls}
      role="button"
      tabIndex={0}
      onClick={() => doForceSync()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          doForceSync();
        }
      }}
      aria-pressed={syncing}
      aria-live="polite"
    >
      {syncing ? <span className={styles.spinner} aria-hidden="true" /> : null}
      {label}
    </span>
  );
}

export default RepoSyncStatus;
