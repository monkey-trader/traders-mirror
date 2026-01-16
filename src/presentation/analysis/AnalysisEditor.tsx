import React, { useState } from 'react';
import styles from './AnalysisEditor.module.css';
import type { TimeframeAnalysis } from './AnalysisDetail';
import type { AnalysisFormValues } from './validation';
import { Input } from '@/presentation/shared/components/Input/Input';
import { Textarea } from '@/presentation/shared/components/Textarea/Textarea';
import { Button } from '@/presentation/shared/components/Button/Button';
import type { TimeframeInput } from '@/presentation/analysis/types';
import { DEFAULT_TIMEFRAMES } from '@/presentation/analysis/types';
import { MarketSelect } from '@/presentation/shared/components/MarketSelect/MarketSelect';
import type { MarketValue } from '@/presentation/shared/components/MarketSelect/MarketSelect';
import { TimeframeWizard } from './components/TimeframeWizard/TimeframeWizard';

import { validateAll } from './validation';
type Props = {
  initial?: {
    symbol?: string;
    notes?: string;
    timeframes?: Partial<Record<string, TimeframeAnalysis>>;
    market?: 'Forex' | 'Crypto';
  };
  onSave?: (input: AnalysisFormValues & { timeframes?: TimeframeInput[] }) => Promise<void> | void;
  // optional field to focus when the editor mounts or when changed
  focusField?: string | null;
};

export function AnalysisEditor({ initial = {}, onSave, focusField }: Props) {
  const [symbol, setSymbol] = useState(initial.symbol ?? '');
  const [notes, setNotes] = useState(initial.notes ?? '');
  const [market, setMarket] = useState<MarketValue>(
    () => (initial.market ?? 'Forex') as MarketValue
  );
  const [wizardMode, setWizardMode] = useState(true);
  const [timeframes, setTimeframes] = useState<TimeframeInput[]>(() => {
    const base = DEFAULT_TIMEFRAMES.map((t) => ({ timeframe: t }));
    if (initial.timeframes) {
      return base.map((b) => {
        const tf = (initial.timeframes as Record<string, TimeframeAnalysis>)[b.timeframe];
        return {
          ...b,
          tradingViewLink: tf?.tradingViewLink,
          note: tf?.note,
        };
      });
    }
    return base;
  });
  const [saving, setSaving] = useState(false);

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AnalysisFormValues, string>>>(
    {}
  );
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const symbolRef = React.useRef<HTMLInputElement | null>(null);
  const notesRef = React.useRef<HTMLTextAreaElement | null>(null);
  const tfLinkRefs = React.useRef<Record<string, HTMLInputElement | null>>({});
  const tfNoteRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

  React.useEffect(() => {
    if (!focusField) return;
    setTimeout(() => {
      try {
        if (focusField === 'symbol' && symbolRef.current) symbolRef.current.focus();
        if (focusField === 'notes' && notesRef.current) notesRef.current.focus();
        // timeframe field format: tf:<timeframe>:note or tf:<timeframe>:link
        if (focusField.startsWith('tf:')) {
          const parts = focusField.split(':');
          if (parts.length === 3) {
            const tfKey = parts[1];
            const which = parts[2];
            if (which === 'note' && tfNoteRefs.current[tfKey]) tfNoteRefs.current[tfKey]!.focus();
            if (which === 'link' && tfLinkRefs.current[tfKey]) tfLinkRefs.current[tfKey]!.focus();
          }
        }
      } catch {
        /* ignore */
      }
    }, 50);
  }, [focusField]);
  const handleTimeframeChange = (index: number, patch: Partial<TimeframeInput>) => {
    setTimeframes((prev) => {
      const copy = prev.slice();
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const values: AnalysisFormValues = { symbol, notes, market: market as 'Forex' | 'Crypto' };
    const errors = validateAll(values);
    setFormErrors(errors);
    setFormSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave({ symbol, notes, timeframes, market: market as 'Forex' | 'Crypto' });
      // keep form values after save to avoid layout reflow; parent may clear if desired
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} data-testid="analysis-editor">
      <div className={styles.row}>
        <div className={styles.symbolField}>
          <Input
            label="Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            inputRef={symbolRef}
            aria-label="Symbol"
            onBlur={() => setTouched((t) => ({ ...t, symbol: true }))}
            hasError={Boolean(formErrors.symbol && (touched.symbol || formSubmitted))}
            aria-describedby={
              formErrors.symbol && (touched.symbol || formSubmitted) ? 'symbol-error' : undefined
            }
          />
          {formErrors.symbol && (touched.symbol || formSubmitted) && (
            <div id="symbol-error" className={styles.fieldError}>
              {formErrors.symbol}
            </div>
          )}
        </div>
        <div style={{ marginLeft: 12 }}>
          <MarketSelect
            label="Market"
            value={market}
            onChange={(v) => setMarket(v)}
            showAll={false}
            compact
            hasError={Boolean(formErrors.market && (touched.market || formSubmitted))}
            ariaDescribedBy={
              formErrors.market && (touched.market || formSubmitted) ? 'market-error' : undefined
            }
          />
        </div>
        {formErrors.market && (touched.market || formSubmitted) && (
          <div id="market-error" className={styles.fieldError}>
            {formErrors.market}
          </div>
        )}
      </div>

      <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} inputRef={notesRef} />

      <div
        className={styles.timeframesHeader}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h4 className={styles.tfTitle}>Timeframes</h4>
        <div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setWizardMode((v) => !v)}
            className={styles.toggleWizardBtn}
          >
            {wizardMode ? 'Use list' : 'Use wizard'}
          </Button>
        </div>
      </div>

      {wizardMode ? (
        <TimeframeWizard
          timeframes={timeframes}
          onChangeTimeframe={handleTimeframeChange}
          onFinish={() => setWizardMode(false)}
        />
      ) : (
        <div className={styles.timeframes}>
          {timeframes.map((tf, i) => (
            <div key={tf.timeframe} className={styles.tfRow}>
              <div className={styles.tfLabel}>{tf.timeframe.toUpperCase()}</div>
              <Input
                className={styles.tfInput}
                placeholder="TradingView Link"
                value={tf.tradingViewLink ?? ''}
                onChange={(e) => handleTimeframeChange(i, { tradingViewLink: e.target.value })}
                inputRef={(el: HTMLInputElement | null) => {
                  if (el) tfLinkRefs.current[tf.timeframe] = el;
                  else delete tfLinkRefs.current[tf.timeframe];
                }}
              />
              <Input
                className={styles.tfInput}
                placeholder="Note"
                value={tf.note ?? ''}
                onChange={(e) => handleTimeframeChange(i, { note: e.target.value })}
                inputRef={(el: HTMLInputElement | null) => {
                  if (el) tfNoteRefs.current[tf.timeframe] = el;
                  else delete tfNoteRefs.current[tf.timeframe];
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <Button type="submit" variant="primary" className={styles.button} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
