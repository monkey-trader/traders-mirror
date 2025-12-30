import React, { useState } from 'react';
import styles from './AnalysisEditor.module.css';
import type { TimeframeAnalysis } from './AnalysisDetail';
import type { AnalysisFormValues } from './validation';
import { Input } from '@/presentation/shared/components/Input/Input';
import { Textarea } from '@/presentation/shared/components/Textarea/Textarea';

export type TimeframeKey = 'monthly' | 'weekly' | 'daily' | '4h' | '2h' | '1h' | '15min';
export type TimeframeInput = { timeframe: TimeframeKey; tradingViewLink?: string; note?: string };

type Props = {
  initial?: {
    symbol?: string;
    notes?: string;
    timeframes?: Partial<Record<string, TimeframeAnalysis>>;
  };
  onSave?: (input: AnalysisFormValues & { timeframes?: TimeframeInput[] }) => Promise<void> | void;
};

const DEFAULT_TIMEFRAMES: TimeframeKey[] = [
  'monthly',
  'weekly',
  'daily',
  '4h',
  '2h',
  '1h',
  '15min',
];

export function AnalysisEditor({ initial = {}, onSave }: Props) {
  const [symbol, setSymbol] = useState(initial.symbol ?? '');
  const [notes, setNotes] = useState(initial.notes ?? '');
  const [timeframes, setTimeframes] = useState<TimeframeInput[]>(() =>
    DEFAULT_TIMEFRAMES.map((t) => ({ timeframe: t }))
  );
  const [saving, setSaving] = useState(false);

  const handleTimeframeChange = (index: number, patch: Partial<TimeframeInput>) => {
    setTimeframes((prev) => {
      const copy = prev.slice();
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave({ symbol, notes, timeframes });
      // keep form values after save to avoid layout reflow; parent may clear if desired
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} data-testid="analysis-editor">
      <div className={styles.row}>
        <Input
          label="Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          required
          aria-label="Symbol"
        />
      </div>

      <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

      <div className={styles.timeframes}>
        <h4 className={styles.tfTitle}>Timeframes</h4>
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

      <div className={styles.actions}>
        <button type="submit" className={styles.button} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
