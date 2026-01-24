import React, { useState } from 'react';
import { ConfluenceOption } from './ConfluenceModal';
import { FibLevelModal } from './FibLevelModal';
import ConfluenceWizardModal from '@/presentation/confluenceWizard/ConfluenceModal';
import styles from './SetupSelector.module.css';

export type SetupSelectorProps = {
  selectedFibLevel: string | null;
  selectedConfluence: ConfluenceOption[];
  onChange: (fibLevel: string | null, confluence: ConfluenceOption[]) => void;
};

export function SetupSelector({
  selectedFibLevel,
  selectedConfluence,
  onChange,
}: SetupSelectorProps) {
  const [fibModalOpen, setFibModalOpen] = useState(false);
  const [confluenceModalOpen, setConfluenceModalOpen] = useState(false);

  function handleFibChange(fib: string | null) {
    onChange(fib, selectedConfluence);
  }

  function handleConfluenceChange(newConfluence: ConfluenceOption[]) {
    onChange(selectedFibLevel, newConfluence);
  }

  return (
    <div className={styles.root}>
      <div className={styles.section}>
        <button type="button" className={styles.modalBtn} onClick={() => setFibModalOpen(true)}>
          <span role="img" aria-label="SK Entry" style={{ marginRight: 8 }}>
            🎯
          </span>
          {selectedFibLevel ? selectedFibLevel : 'SK Entry wählen'}
        </button>
        <FibLevelModal
          open={fibModalOpen}
          selectedFibLevel={selectedFibLevel}
          onChange={(fib: string | null) => {
            handleFibChange(fib);
            setFibModalOpen(false);
          }}
          onClose={() => setFibModalOpen(false)}
        />
      </div>

      <div className={styles.section}>
        <button
          type="button"
          className={styles.modalBtn}
          onClick={() => setConfluenceModalOpen(true)}
        >
          <span role="img" aria-label="Confluence" style={{ marginRight: 8 }}>
            ✨
          </span>
          {selectedConfluence.length > 0 ? 'Confluence gewählt' : 'Confluence auswählen'}
        </button>
        <div className={styles.chipRow} style={{ marginTop: 8, justifyContent: 'center' }}>
          {selectedConfluence.length === 0 ? (
            <span style={{ color: '#888' }}>Keine Confluence gewählt</span>
          ) : (
            <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>
              {selectedConfluence
                .map((c) => (c.timeframe ? `${c.timeframe} ${c.type}` : c.type))
                .join(', ')}
            </span>
          )}
        </div>
        <ConfluenceWizardModal
          open={confluenceModalOpen}
          onClose={() => setConfluenceModalOpen(false)}
          onConfirm={(data: any) => {
            // map wizard payload (supports aggregated selections per timeframe)
            const mapped: ConfluenceOption[] = [];
            try {
              // new wizard returns `{ selections: { [timeframe]: { confluence: {...}, extra: {...} } } }`
              const selections = data?.selections as Record<string, any> | undefined;
              if (selections) {
                for (const [tf, sel] of Object.entries(selections)) {
                  const conf = sel?.confluence as Record<string, boolean> | undefined;
                  const extra = sel?.extra as Record<string, boolean> | undefined;
                  if (conf) {
                    for (const [key, val] of Object.entries(conf)) {
                      if (val) mapped.push({ timeframe: tf as any, type: key as any });
                    }
                  }
                  if (extra) {
                    for (const [key, val] of Object.entries(extra)) {
                      if (val) mapped.push({ type: key as any });
                    }
                  }
                }
              } else {
                // fallback for older single-timeframe payload
                const timeframe = data?.timeframe as string | undefined;
                const confluence = data?.confluence as Record<string, boolean> | undefined;
                const extra = data?.extra as Record<string, boolean> | undefined;
                if (confluence && timeframe) {
                  for (const [key, val] of Object.entries(confluence)) {
                    if (val) mapped.push({ timeframe: timeframe as any, type: key as any });
                  }
                }
                if (extra) {
                  for (const [key, val] of Object.entries(extra)) {
                    if (val) mapped.push({ type: key as any });
                  }
                }
              }
            } catch {
              /* ignore */
            }
            handleConfluenceChange(mapped);
            setConfluenceModalOpen(false);
          }}
        />
      </div>
    </div>
  );
}
