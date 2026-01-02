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
};

export function AnalysisEditor({ initial = {}, onSave }: Props) {
  const [symbol, setSymbol] = useState(initial.symbol ?? '');
  const [notes, setNotes] = useState(initial.notes ?? '');
  const [market, setMarket] = useState<MarketValue>(
    () => (initial.market ?? 'Forex') as MarketValue
  );
  const [wizardMode, setWizardMode] = useState(true);
  const [timeframes, setTimeframes] = useState<TimeframeInput[]>(() =>
    DEFAULT_TIMEFRAMES.map((t) => ({ timeframe: t }))
  );
  const [saving, setSaving] = useState(false);

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AnalysisFormValues, string>>>(
    {}
  );
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
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

      <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

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
              />
              <Input
                className={styles.tfInput}
                placeholder="Note"
                value={tf.note ?? ''}
                onChange={(e) => handleTimeframeChange(i, { note: e.target.value })}
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
