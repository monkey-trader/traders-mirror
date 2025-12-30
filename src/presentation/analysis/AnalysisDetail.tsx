import React from 'react';
import styles from './AnalysisDetail.module.css';

type Timeframe = 'monthly' | 'weekly' | 'daily' | '4h' | '2h' | '1h' | '15min';

export type TimeframeAnalysis = {
  timeframe: Timeframe;
  tradingViewLink?: string;
  note?: string;
};

export type AnalysisDTO = {
  id: string;
  symbol: string;
  createdAt: string;
  updatedAt?: string;
  timeframes: Record<Timeframe, TimeframeAnalysis>;
  notes?: string;
};

type Props = {
  analysis: AnalysisDTO;
  compactView?: boolean;
  onCreateTrade?: (analysisId: string) => void;
};

export function AnalysisDetail({ analysis, compactView = false, onCreateTrade }: Props) {
  return (
    <div className={styles.container} data-testid="analysis-detail">
      <div className={styles.header}>
        <h2 className={styles.symbol}>{analysis.symbol}</h2>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.button}
            onClick={() => onCreateTrade && onCreateTrade(analysis.id)}
          >
            Create Trade
          </button>
        </div>
      </div>

      <div className={styles.notes}>{analysis.notes}</div>

      <div className={styles.timeframes}>
        {Object.values(analysis.timeframes).map((tf) => (
          <div key={tf.timeframe} className={`${styles.tf} ${compactView ? styles.compact : ''}`}>
            <div className={styles.tfHeader}>
              <strong>{tf.timeframe.toUpperCase()}</strong>
              {tf.tradingViewLink ? (
                <a
                  href={tf.tradingViewLink}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.link}
                >
                  TV
                </a>
              ) : null}
            </div>
            {tf.note ? <p className={styles.tfNote}>{tf.note}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
