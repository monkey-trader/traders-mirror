import React, { useState } from 'react';
import styles from './ConfluenceWizard.module.css';
import { Card } from '@/presentation/shared/components/Card/Card';
import { Button } from '@/presentation/shared/components/Button/Button';
import { ALLOWED_TIMEFRAMES, ALLOWED_CONFLUENCES, ALLOWED_EXTRA_CONFLUENCES } from '@/domain/trade/valueObjects/Confluence';

const TIMEFRAMES = ALLOWED_TIMEFRAMES.slice();
const CONFLUENCE_OPTIONS = ALLOWED_CONFLUENCES.slice() as readonly string[];
const EXTRA_OPTIONS = ALLOWED_EXTRA_CONFLUENCES.slice() as readonly string[];

type TFSelection = { confluence: Record<string, boolean>; extra: Record<string, boolean> };

export function ConfluenceWizard({
  onConfirm,
  onCancel,
}: {
  onConfirm: (data: any) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('');
  // aggregate selections per timeframe
  const [selections, setSelections] = useState<Record<string, TFSelection>>({});
  // current editing buffers
  const [selectedConfluence, setSelectedConfluence] = useState<Record<string, boolean>>({});
  const [selectedExtra, setSelectedExtra] = useState<Record<string, boolean>>({});

  const handleTimeframeSelect = (tf: string) => {
    setSelectedTimeframe(tf);
    const existing = selections[tf] || { confluence: {}, extra: {} };
    setSelectedConfluence(existing.confluence);
    setSelectedExtra(existing.extra);
    setStep(1);
  };

  const handleConfluenceToggle = (option: string) => {
    setSelectedConfluence((prev) => ({ ...prev, [option]: !prev[option] }));
  };

  const handleExtraToggle = (option: string) => {
    setSelectedExtra((prev) => ({ ...prev, [option]: !prev[option] }));
  };

  const handleSaveCurrent = () => {
    if (!selectedTimeframe) return;
    setSelections((prev) => ({
      ...prev,
      [selectedTimeframe]: { confluence: selectedConfluence, extra: selectedExtra },
    }));
    setSelectedTimeframe('');
    setSelectedConfluence({});
    setSelectedExtra({});
    setStep(0);
  };

  const handleFinish = () => {
    // if editing right now, save that first
    let final = { ...selections };
    if (step === 1 && selectedTimeframe) {
      final = {
        ...final,
        [selectedTimeframe]: { confluence: selectedConfluence, extra: selectedExtra },
      };
    }
    onConfirm({ selections: final });
  };

  const handleRemoveTimeframe = (tf: string) => {
    setSelections((prev) => {
      const copy = { ...prev };
      delete copy[tf];
      return copy;
    });
  };

  return (
    <Card className={styles.card}>
      <h2 className={styles.title}>Confluence Wizard</h2>
      {step === 0 && (
        <div className={styles.step}>
          <h3 className={styles.subtitle}>Timeframe wählen</h3>
          <div className={styles.options}>
            {TIMEFRAMES.map((tf) => (
              <Button
                key={tf}
                className={
                  selections[tf] ? `${styles.optionBtn} ${styles.selected}` : styles.optionBtn
                }
                onClick={() => handleTimeframeSelect(tf)}
              >
                {tf}
              </Button>
            ))}
          </div>

          <div className={styles.summaryRow}>
            <div className={styles.summaryList}>
              {Object.keys(selections).length === 0 ? (
                <span className={styles.hint}>Noch keine Auswahl für Timeframes</span>
              ) : (
                Object.entries(selections).map(([tf, sel]) => (
                  <div key={tf} className={styles.summaryItem}>
                    <strong>{tf}</strong>
                    <div className={styles.summaryTypes}>
                      {Object.entries(sel.confluence)
                        .filter(([, v]) => v)
                        .map(([k]) => (
                          <span key={k}>{k}</span>
                        ))}
                      {Object.entries(sel.extra)
                        .filter(([, v]) => v)
                        .map(([k]) => (
                          <span key={k}>{k}</span>
                        ))}
                    </div>
                    <button
                      className={styles.removeBtn}
                      onClick={() => handleRemoveTimeframe(tf)}
                      aria-label={`Remove ${tf}`}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <Button className={styles.cancelBtn} onClick={onCancel}>
              Abbrechen
            </Button>
            <Button className={styles.confirmBtn} onClick={handleFinish}>
              Fertig
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className={styles.step}>
          <h3 className={styles.subtitle}>{selectedTimeframe} Confluence auswählen</h3>
          <div className={styles.switchGroup}>
            {CONFLUENCE_OPTIONS.map((opt) => (
              <label key={opt} className={styles.switchLabel}>
                <input
                  type="checkbox"
                  checked={!!selectedConfluence[opt]}
                  onChange={() => handleConfluenceToggle(opt)}
                />
                <span className={styles.switchText}>{opt}</span>
              </label>
            ))}
          </div>
          <h4 className={styles.subtitle}>Weitere Confluence</h4>
          <div className={styles.switchGroup}>
            {EXTRA_OPTIONS.map((opt) => (
              <label key={opt} className={styles.switchLabel}>
                <input
                  type="checkbox"
                  checked={!!selectedExtra[opt]}
                  onChange={() => handleExtraToggle(opt)}
                />
                <span className={styles.switchText}>{opt}</span>
              </label>
            ))}
          </div>
          <div className={styles.actions}>
            <Button
              className={styles.cancelBtn}
              onClick={() => {
                setStep(0);
              }}
            >
              {'Zurück'}
            </Button>
            <Button className={styles.confirmBtn} onClick={handleSaveCurrent}>
              {'Speichern'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
