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
        <MockLoaderToggle />
        <StorageControls />
      </section>
    </div>
  );
}
