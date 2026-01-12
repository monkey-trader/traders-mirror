import React from 'react';
import styles from './Settings.module.css';
import { ThemeSwitcher } from '@/presentation/shared/components/ThemeSwitcher/ThemeSwitcher';
import { loadSettings, saveSettings } from './settingsStorage';
import { Button } from '@/presentation/shared/components/Button/Button';
import { LocalStorageAnalysisRepository } from '@/infrastructure/analysis/repositories/LocalStorageAnalysisRepository';
import LocalStorageTradeRepository from '@/infrastructure/trade/repositories/LocalStorageTradeRepository';
import { loadMockAnalyses, clearAnalyses } from '@/presentation/analysis/mockLoader';
import { ConfirmDialog } from '@/presentation/shared/components/ConfirmDialog/ConfirmDialog';
import type { AnalysisDTO } from '@/domain/analysis/interfaces/AnalysisRepository';
import { COMBINED_MOCK_TRADES } from '@/infrastructure/trade/repositories/mockData';
import { RepoSyncStatus } from '@/presentation/shared/components/RepoSyncStatus/RepoSyncStatus';
import { Switch } from '@/presentation/shared/components/Switch/Switch';

function DebugToggle() {
  const [enabled, setEnabled] = React.useState<boolean>(() => {
    const s = loadSettings();
    // if env var is set, treat as default but still allow user override
    const envDefault =
      typeof process !== 'undefined' &&
      (process.env.REACT_APP_DEBUG_UI === 'true' || process.env.NODE_ENV === 'development');
    return typeof s.debugUI === 'boolean' ? s.debugUI : envDefault;
  });

  const onToggle = (v: boolean) => {
    setEnabled(v);
    const s = loadSettings();
    saveSettings({ ...s, debugUI: v });
  };

  return (
    <div className={styles.debugRow}>
      <label className={styles.fieldLabel}>Debug UI</label>
      <div>
        <button
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle debug UI"
          className={`${styles.debugBtn} ${enabled ? styles.on : styles.off}`}
          onClick={() => onToggle(!enabled)}
          type="button"
        >
          {enabled ? 'Debug ON' : 'Debug OFF'}
        </button>
      </div>
      <p className={styles.help}>
        Enable developer UI features (status banners, extra logs). Stored in browser settings.
      </p>
    </div>
  );
}

function MockLoaderToggle() {
  const [enabled, setEnabled] = React.useState<boolean>(() => {
    const s = loadSettings();
    // default: show the Load mock data button unless user explicitly disables it
    return typeof s.showLoadMockButton === 'boolean' ? s.showLoadMockButton : true;
  });

  const onToggle = (v: boolean) => {
    setEnabled(v);
    const s = loadSettings();
    saveSettings({ ...s, showLoadMockButton: v });
  };

  return (
    <div className={styles.debugRow}>
      <label className={styles.fieldLabel}>Show "Load mock data"</label>
      <div>
        <button
          aria-checked={enabled}
          aria-label="Toggle show load mock button"
          className={`${styles.debugBtn} ${enabled ? styles.on : styles.off}`}
          onClick={() => onToggle(!enabled)}
          type="button"
        >
          {enabled ? 'Visible' : 'Hidden'}
        </button>
      </div>
      <p className={styles.help}>
        Show or hide the "Load mock data" control in the Trading Journal. Stored in browser
        settings.
      </p>
    </div>
  );
}

function CloudSyncToggle() {
  const remoteCapable = (() => {
    const viteFlag = (import.meta as unknown as { env?: Record<string, unknown> }).env?.[
      'VITE_USE_FIREBASE'
    ];
    const craFlag = (process.env as Record<string, string | undefined>).REACT_APP_USE_FIREBASE;
    const raw = (viteFlag as string | boolean | undefined) ?? craFlag;
    if (typeof raw === 'boolean') return raw;
    if (typeof raw === 'string') return raw.toLowerCase() === 'true';
    return false;
  })();

  const [enabled, setEnabled] = React.useState<boolean>(() => {
    const s = loadSettings();
    // default: if remote is capable via env, enable unless user opted out
    if (!remoteCapable) return false;
    return typeof s.useCloudSync === 'boolean' ? s.useCloudSync : true;
  });

  const onToggle = (v: boolean) => {
    setEnabled(v);
    const s = loadSettings();
    saveSettings({ ...s, useCloudSync: v });
    try {
      globalThis.dispatchEvent(
        new CustomEvent('settings-changed', { detail: { useCloudSync: v } })
      );
    } catch {
      /* ignore */
    }
  };

  const stateLabel = remoteCapable ? (enabled ? 'Enabled' : 'Disabled') : 'Unavailable';
  const stateClass = remoteCapable ? (enabled ? styles.stateOn : styles.stateOff) : styles.stateOff;

  return (
    <div className={styles.debugRow}>
      <label className={styles.fieldLabel}>Cloud Sync (Firebase)</label>
      <div className={styles.toggleRow}>
        <Switch
          checked={enabled && remoteCapable}
          onChange={onToggle}
          ariaLabel="Toggle cloud sync"
          disabled={!remoteCapable}
        />
        <span className={`${styles.stateText} ${stateClass}`}>{stateLabel}</span>
      </div>
      <p className={styles.help}>
        Uses local storage offline-first and syncs to Firebase when enabled. Preference is saved
        to your browser. If disabled, the app stays local-only.
      </p>
      <div className={styles.syncRow}>
        <RepoSyncStatus compactView />
        <span className={styles.syncHelp}>Current sync status</span>
      </div>
    </div>
  );
}

function StorageControls() {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<'clear' | 'restore' | null>(null);
  const [infoMessage, setInfoMessage] = React.useState<string | null>(null);
  const infoTimerRef = React.useRef<number | null>(null);

  const openConfirm = (action: 'clear' | 'restore') => {
    setConfirmAction(action);
    setConfirmOpen(true);
  };

  const onConfirm = async () => {
    if (!confirmAction) {
      setConfirmOpen(false);
      return;
    }
    // typed no-op setter for analysis list updates (used when calling loader/clear from settings)
    const noopSetAnalyses: (items: AnalysisDTO[]) => void = () => {
      // intentionally no-op; UI will refresh via storage events
    };

    try {
      if (confirmAction === 'clear') {
        // clear stored trades
        const raw = localStorage.getItem('mt_trades_v1');
        let count = 0;
        try {
          const parsed = raw ? JSON.parse(raw) : [];
          if (Array.isArray(parsed)) count = parsed.length;
        } catch {
          count = 0;
        }
        localStorage.removeItem('mt_trades_v1');
        // also clear analyses storage via repository + loader helper
        try {
          const analysisRepo = new LocalStorageAnalysisRepository();
          // clearAnalyses expects a setter; provide a typed no-op
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          clearAnalyses(analysisRepo, noopSetAnalyses);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('Failed to clear analyses when deleting demo data', err);
        }

        setInfoMessage(`Deleted ${count} stored trade${count === 1 ? '' : 's'}`);
        if (infoTimerRef.current) window.clearTimeout(infoTimerRef.current);
        infoTimerRef.current = window.setTimeout(
          () => window.location.reload(),
          1200
        ) as unknown as number;
      } else if (confirmAction === 'restore') {
        const count = Array.isArray(COMBINED_MOCK_TRADES) ? COMBINED_MOCK_TRADES.length : 0;
        // persist trades first
        localStorage.setItem('mt_trades_v1', JSON.stringify(COMBINED_MOCK_TRADES));

        // then seed analyses based on the restored trades and link them back
        try {
          const tradeRepo = new LocalStorageTradeRepository(undefined, { seedDefaults: false });
          const analysisRepo = new LocalStorageAnalysisRepository();
          // get domain trades from repo and load mock analyses
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          (async () => {
            try {
              const trades = await tradeRepo.getAll();
              // call loader with a typed no-op setter; UI components will refresh via storage events
              await loadMockAnalyses(
                analysisRepo,
                trades,
                noopSetAnalyses,
                tradeRepo,
                Math.min(5, count)
              );
            } catch (err) {
              // eslint-disable-next-line no-console
              console.warn('Failed to seed analyses for restored demo trades', err);
            }
          })();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('Failed to initialize repos for demo data restore', err);
        }

        setInfoMessage(`Loaded ${count} demo trade${count === 1 ? '' : 's'}`);
        if (infoTimerRef.current) window.clearTimeout(infoTimerRef.current);
        infoTimerRef.current = window.setTimeout(
          () => window.location.reload(),
          1200
        ) as unknown as number;
      }
    } finally {
      setConfirmOpen(false);
      setConfirmAction(null);
    }
  };

  const onCancel = () => {
    setConfirmOpen(false);
    setConfirmAction(null);
  };

  // Clean up any pending info timer on unmount
  React.useEffect(() => {
    return () => {
      if (infoTimerRef.current) {
        try {
          window.clearTimeout(infoTimerRef.current);
        } catch {
          /* ignore */
        }
        infoTimerRef.current = null;
      }
    };
  }, []);

  const clearStoredTrades = () => {
    openConfirm('clear');
  };

  const restoreDemoData = () => {
    openConfirm('restore');
  };

  return (
    <div className={styles.debugRow} style={{ alignItems: 'center' }}>
      <label className={styles.fieldLabel}>Storage</label>
      <div className={styles.storageButtons}>
        <Button variant="danger" onClick={clearStoredTrades}>
          Delete demo data
        </Button>
        <Button variant="primary" onClick={restoreDemoData}>
          Add demo data
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title={confirmAction === 'clear' ? 'Delete demo data' : 'Add demo data'}
        message={
          confirmAction === 'clear'
            ? 'Alle gespeicherten Trades entfernen? Diese Aktion kann nicht rückgängig gemacht werden.'
            : 'Demo-Daten wiederherstellen? Existierende Daten werden überschrieben.'
        }
        confirmLabel={confirmAction === 'clear' ? 'Löschen' : 'Wiederherstellen'}
        cancelLabel="Abbrechen"
        onConfirm={onConfirm}
        onCancel={onCancel}
        confirmVariant={confirmAction === 'clear' ? 'danger' : 'primary'}
      />
      <p className={styles.help}>
        Remove or restore the demo trades stored in your browser localStorage (key: mt_trades_v1).
      </p>
      {/* transitory info banner (placed below the description as requested) */}
      {infoMessage && (
        <div role="status" aria-live="polite" className={styles.infoBanner}>
          {infoMessage}
        </div>
      )}
    </div>
  );
}

export function Settings({ compactView }: { compactView?: boolean }) {
  const buildInfo = React.useMemo(() => {
    // Support both CRA and Vite envs; use literal CRA access so bundlers inline correctly.
    const viteEnv = (
      typeof import.meta !== 'undefined'
        ? (import.meta as unknown as { env?: Record<string, string | boolean | undefined> }).env ||
          {}
        : {}
    ) as Record<string, string | boolean | undefined>;

    const viteBranch =
      typeof viteEnv.VITE_BUILD_BRANCH === 'string' ? viteEnv.VITE_BUILD_BRANCH : undefined;
    const viteSha = typeof viteEnv.VITE_BUILD_SHA === 'string' ? viteEnv.VITE_BUILD_SHA : undefined;
    const viteTag = typeof viteEnv.VITE_BUILD_TAG === 'string' ? viteEnv.VITE_BUILD_TAG : undefined;
    const viteTime =
      typeof viteEnv.VITE_BUILD_TIME === 'string' ? viteEnv.VITE_BUILD_TIME : undefined;

    const craBranch =
      (typeof process !== 'undefined' && process.env && process.env.REACT_APP_BUILD_BRANCH) ||
      undefined;
    const craSha =
      (typeof process !== 'undefined' && process.env && process.env.REACT_APP_BUILD_SHA) ||
      undefined;
    const craTag =
      (typeof process !== 'undefined' && process.env && process.env.REACT_APP_BUILD_TAG) ||
      undefined;
    const craTime =
      (typeof process !== 'undefined' && process.env && process.env.REACT_APP_BUILD_TIME) ||
      undefined;

    let branch = String(viteBranch || craBranch || '');
    let sha = String(viteSha || craSha || '');
    let tag = String(viteTag || craTag || '');
    let time = String(viteTime || craTime || '');

    // Runtime fallback: window.__BUILD_INFO__ injected by CI deploy
    try {
      const injected =
        (typeof window !== 'undefined' && (window as Window).__BUILD_INFO__) || undefined;
      if (injected) {
        branch = branch || String(injected.branch || '');
        sha = sha || String(injected.sha || '');
        tag = tag || String(injected.tag || '');
        time = time || String(injected.time || '');
      }
    } catch {
      /* ignore */
    }

    return { branch, sha, tag, time };
  }, []);
  const [resolvedBuildInfo, setResolvedBuildInfo] = React.useState(buildInfo);

  // Runtime fetch fallback: attempt to load build-info.json if some fields are missing
  React.useEffect(() => {
    const needsFetch = !buildInfo.branch || !buildInfo.sha || !buildInfo.tag || !buildInfo.time;
    if (!needsFetch) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('build-info.json', { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as Partial<{
          branch: string;
          sha: string;
          tag: string;
          time: string;
        }>;
        if (cancelled) return;
        setResolvedBuildInfo((prev) => ({
          branch: prev.branch || String(json.branch || ''),
          sha: prev.sha || String(json.sha || ''),
          tag: prev.tag || String(json.tag || ''),
          time: prev.time || String(json.time || ''),
        }));
      } catch {
        // ignore network errors; keep existing values
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [buildInfo.branch, buildInfo.sha, buildInfo.tag, buildInfo.time]);
  return (
    <div
      className={compactView ? `${styles.container} ${styles.compact}` : styles.container}
      data-compact={compactView}
    >
      <h2>Settings</h2>

      <section className={styles.section}>
        <h3>Look & Feel</h3>
        <p className={styles.help}>
          Choose a theme to apply the color scheme across the app. This setting is saved to your
          browser.
        </p>
        <div className={styles.themeRow}>
          <ThemeSwitcher />
        </div>
      </section>

      <section className={styles.section}>
        <h3>Debug</h3>
        <DebugToggle />
        <CloudSyncToggle />
        <MockLoaderToggle />
        <StorageControls />
      </section>

      <section className={styles.section}>
        <h3>Build Info</h3>
        <p className={styles.help}>Metadata about this deployed build.</p>
        <div className={styles.debugRow}>
          <label className={styles.fieldLabel}>Branch</label>
          <div>{resolvedBuildInfo.branch || 'n/a'}</div>
        </div>
        <div className={styles.debugRow}>
          <label className={styles.fieldLabel}>Commit</label>
          <div>
            {resolvedBuildInfo.sha ? (
              <a
                href={`https://github.com/${
                  (typeof process !== 'undefined' && process.env.GITHUB_REPOSITORY) ||
                  'monkey-trader/traders-mirror'
                }/commit/${resolvedBuildInfo.sha}`}
                target="_blank"
                rel="noreferrer"
              >
                {resolvedBuildInfo.sha.substring(0, 7)}
              </a>
            ) : (
              'n/a'
            )}
          </div>
        </div>
        <div className={styles.debugRow}>
          <label className={styles.fieldLabel}>Tag</label>
          <div>{resolvedBuildInfo.tag || 'n/a'}</div>
        </div>
        <div className={styles.debugRow}>
          <label className={styles.fieldLabel}>Built</label>
          <div>{resolvedBuildInfo.time || 'n/a'}</div>
        </div>
      </section>
    </div>
  );
}
