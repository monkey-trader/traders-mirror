import React from 'react';
import styles from './AnalysisDetail.module.css';
import { Button } from '@/presentation/shared/components/Button/Button';
import { IconButton } from '@/presentation/shared/components/IconButton/IconButton';
import LocalStorageTradeRepository from '@/infrastructure/trade/repositories/LocalStorageTradeRepository';
import { useEffect, useState } from 'react';

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
  onRequestDelete?: (id: string) => void;
};

export function AnalysisDetail({ analysis, compactView = false, onCreateTrade, onRequestDelete }: Props) {
  const [hasLinkedTrade, setHasLinkedTrade] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const repo = new LocalStorageTradeRepository(undefined, { seedDefaults: false });
        const trades = await repo.getAll();
        if (!mounted) return;
        const found = trades.find((t) => (t as unknown as { analysisId?: string }).analysisId === analysis.id);
        setHasLinkedTrade(Boolean(found));
      } catch {
        // ignore and assume no linked trade
        if (mounted) setHasLinkedTrade(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [analysis.id]);
  return (
    <div className={styles.container} data-testid="analysis-detail">
      <div className={styles.header}>
        <h2 className={styles.symbol}>{analysis.symbol}</h2>
        <div className={styles.actions}>
          <Button
            variant="primary"
            className={styles.createBtn}
            onClick={() => onCreateTrade && onCreateTrade(analysis.id)}
          >
            Create Trade
          </Button>
          {hasLinkedTrade ? (
            <IconButton
              variant="ghost"
              color="primary"
              className={styles.openTradeBtn}
              ariaLabel={`Open trade for ${analysis.symbol}`}
              onClick={() => {
                try {
                  globalThis.location.hash = '#/journal';
                  setTimeout(() => {
                    try {
                      globalThis.dispatchEvent(
                        new CustomEvent('open-trade', { detail: { analysisId: analysis.id } })
                      );
                    } catch {
                      /* ignore */
                    }
                  }, 50);
                } catch {
                  /* ignore */
                }
              }}
              style={{ marginLeft: 8 }}
            >
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42L17.59 5H14V3zM5 5h6v2H7v10h10v-4h2v6H5V5z" fill="currentColor" />
              </svg>
            </IconButton>
          ) : null}
          <Button
            variant="danger"
            onClick={() => {
              try {
                if (onRequestDelete) onRequestDelete(analysis.id);
              } catch {
                /* ignore */
              }
            }}
            style={{ marginLeft: 8 }}
          >
            Delete
          </Button>
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
                  aria-label="Open TradingView link"
                  title="Open in TradingView"
                >
                  <svg
                    className={styles.tvIcon}
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <path
                      d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h6v2H7v2h10v-2h-2v-2h6c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM21 17H3V5h18v12zM9 21h6v-2H9v2z"
                      fill="currentColor"
                    />
                  </svg>
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

export default AnalysisDetail;
