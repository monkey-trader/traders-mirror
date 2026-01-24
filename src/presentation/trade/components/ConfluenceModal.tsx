import React from 'react';

// Neue Typen für strukturierte Auswahl
export type ConfluenceOption = {
  timeframe?: 'Monthly' | 'Weekly' | 'Daily' | '4H' | '2H' | '1H';
  type:
    | '50% Wick'
    | '50 EMA'
    | '200 EMA'
    | 'FVG'
    | 'Liquidität cluster'
    | 'CME Close'
    | 'Doppelter Vorteil'
    | 'Einzelne Liq. Level';
};

const TIMEFRAMES = ['Monthly', 'Weekly', 'Daily', '4H', '2H', '1H'] as const;
const TYPES = ['50% Wick', '50 EMA', '200 EMA', 'FVG', 'Liquidität cluster'] as const;
const WEITERE_CONFLUENCE: ConfluenceOption[] = [
  { type: 'CME Close' },
  { type: 'Doppelter Vorteil' },
  { type: 'Einzelne Liq. Level' },
];

// Alle Optionen für die Zeitbereiche generieren
const TIMEFRAME_OPTIONS: { [key: string]: ConfluenceOption[] } = {};
for (const tf of TIMEFRAMES) {
  TIMEFRAME_OPTIONS[tf] = TYPES.map((type) => ({ timeframe: tf, type }));
}
import styles from './ConfluenceModal.module.css';
import { Button } from '@/presentation/shared/components/Button/Button';
import { Switch } from '@/presentation/shared/components/Switch/Switch';

export type ConfluenceModalProps = {
  open: boolean;
  selectedConfluence: ConfluenceOption[];
  onChange: (confluence: ConfluenceOption[]) => void;
  onClose: () => void;
  onConfirm?: () => void;
};

// Note: Keep option lists next to the UI that uses them (TIMEFRAME_OPTIONS, WEITERE_CONFLUENCE).

export const ConfluenceModal = ({
  open,
  selectedConfluence,
  onChange,
  onClose,
  onConfirm,
}: ConfluenceModalProps) => {
  const [internalSelection, setInternalSelection] =
    React.useState<ConfluenceOption[]>(selectedConfluence);
  React.useEffect(() => {
    if (open) setInternalSelection(selectedConfluence);
  }, [open, selectedConfluence]);
  if (!open) return null;

  function isSelected(opt: ConfluenceOption) {
    return internalSelection.some(
      (sel) => sel.type === opt.type && sel.timeframe === opt.timeframe
    );
  }
  function toggleOption(opt: ConfluenceOption) {
    setInternalSelection((prev) =>
      isSelected(opt)
        ? prev.filter((sel) => !(sel.type === opt.type && sel.timeframe === opt.timeframe))
        : [...prev, opt]
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Confluence auswählen</h2>
        {TIMEFRAMES.map((tf) => (
          <div className={styles.section} key={tf}>
            <div className={styles.title}>{tf}</div>
            <div className={styles.chipRow}>
              {TIMEFRAME_OPTIONS[tf].map((opt) => (
                <Switch
                  key={opt.type + '-' + tf}
                  label={opt.type}
                  checked={isSelected(opt)}
                  onChange={() => toggleOption(opt)}
                  ariaLabel={opt.type + ' ' + tf}
                />
              ))}
            </div>
          </div>
        ))}
        <div className={styles.section}>
          <div className={styles.title}>Weitere Confluence</div>
          <div className={styles.chipRow}>
            {WEITERE_CONFLUENCE.map((opt) => (
              <Switch
                key={opt.type}
                label={opt.type}
                checked={isSelected(opt)}
                onChange={() => toggleOption(opt)}
                ariaLabel={opt.type}
              />
            ))}
          </div>
        </div>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Schließen
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              onChange(internalSelection);
              // dispatch global event so other parts of the app can react (same event name used by ConfluenceModal in wizard)
              try {
                globalThis.dispatchEvent(
                  new CustomEvent('confluence-wizard:confirmed', { detail: internalSelection })
                );
              } catch {
                /* ignore */
              }
              if (onConfirm) onConfirm();
              onClose();
            }}
            disabled={internalSelection.length === 0}
            style={{ marginLeft: 8 }}
          >
            Bestätigen
          </Button>
        </div>
      </div>
    </div>
  );
};
