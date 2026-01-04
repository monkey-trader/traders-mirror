import React, { useState } from 'react';
import type { TimeframeInput } from '@/presentation/analysis/types';
import styles from './TimeframeWizard.module.css';
import { Input } from '@/presentation/shared/components/Input/Input';
import { Textarea } from '@/presentation/shared/components/Textarea/Textarea';
import { Button } from '@/presentation/shared/components/Button/Button';
import AddFormCard from '@/presentation/shared/components/AddFormCard/AddFormCard';

type Props = {
  timeframes: TimeframeInput[];
  onChangeTimeframe: (index: number, patch: Partial<TimeframeInput>) => void;
  onFinish?: () => void;
};

export function TimeframeWizard({ timeframes, onChangeTimeframe, onFinish }: Props) {
  const [index, setIndex] = useState(0);

  const tf = timeframes[index];

  const setField = (patch: Partial<TimeframeInput>) => onChangeTimeframe(index, patch);

  const next = () => setIndex((i) => Math.min(i + 1, timeframes.length - 1));
  const back = () => setIndex((i) => Math.max(i - 1, 0));
  const finish = () => onFinish && onFinish();
  const skip = () => {
    // leave fields undefined to represent skipped
    setIndex((i) => Math.min(i + 1, timeframes.length - 1));
  };

  const headerActions = (
    <div className={styles.headerActions}>
      <div className={styles.leftActions}>
        <Button type="button" variant="ghost" onClick={back} disabled={index === 0}>
          Back
        </Button>
        <Button type="button" variant="secondary" onClick={skip}>
          Skip
        </Button>
      </div>
      <div className={styles.rightActions}>
        {index < timeframes.length - 1 ? (
          <Button type="button" variant="primary" onClick={next}>
            Next
          </Button>
        ) : (
          <Button type="button" variant="primary" onClick={finish}>
            Finish
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <AddFormCard title="Timeframes" actions={headerActions} testId="timeframe-wizard-card">
      <div className={styles.wizard} data-testid="timeframe-wizard">
        <div className={styles.pager}>
          {timeframes.map((t, i) => (
            <Button
              key={t.timeframe}
              type="button"
              variant={i === index ? 'primary' : 'ghost'}
              className={styles.pagerBtn}
              onClick={() => setIndex(i)}
              aria-pressed={i === index}
              aria-label={`Jump to ${t.timeframe} timeframe`}
            >
              {t.timeframe.toUpperCase()}
              <span className={styles.badge} aria-hidden>
                {t.tradingViewLink || t.note ? '●' : '–'}
              </span>
            </Button>
          ))}
        </div>

        <div className={styles.formRow}>
          <h4 className={styles.title}>{(tf.timeframe || '').toUpperCase()}</h4>
        </div>

        <div className={styles.formRow}>
          <Input
            label="TradingView Link"
            value={tf.tradingViewLink ?? ''}
            onChange={(e) => setField({ tradingViewLink: e.target.value })}
            placeholder="https://www.tradingview.com/..."
          />
        </div>

        <div className={styles.formRow}>
          <Textarea
            label="Note"
            value={tf.note ?? ''}
            onChange={(e) => setField({ note: e.target.value })}
          />
        </div>
      </div>
    </AddFormCard>
  );
}

export default TimeframeWizard;
