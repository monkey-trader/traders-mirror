import React from 'react';
import styles from './AnalysisDetail.module.css';
import { Button } from '@/presentation/shared/components/Button/Button';
import { IconButton } from '@/presentation/shared/components/IconButton/IconButton';
import LocalStorageTradeRepository from '@/infrastructure/trade/repositories/LocalStorageTradeRepository';
import { useEffect, useState } from 'react';
import { AnalysisEditor } from './AnalysisEditor';
import type { TimeframeInput } from '@/presentation/analysis/types';

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
  market?: 'Forex' | 'Crypto' | { value: string };
};

type Props = {
  analysis: AnalysisDTO;
  compactView?: boolean;
  onSave?: (updated: AnalysisDTO) => Promise<void> | void;
  // optional field name to auto-start editing and focus that field
  startEditingField?: string;
};

export function AnalysisDetail({ analysis, compactView = false, onSave, startEditingField }: Props) {
  const normalizeMarket = (
    m?: 'Forex' | 'Crypto' | { value: string }
  ): 'Forex' | 'Crypto' | undefined => {
    if (!m) return undefined;
    if (typeof m === 'object' && m && 'value' in m && typeof (m as Record<string, unknown>).value === 'string') {
      const v = (m as Record<string, unknown>).value as string;
      return v === 'Forex' || v === 'Crypto' ? (v as 'Forex' | 'Crypto') : undefined;
    }
    if (m === 'Forex' || m === 'Crypto') return m;
    return undefined;
  };
  const [hasLinkedTrade, setHasLinkedTrade] = useState(false);
  const [editing, setEditing] = useState(false);
  const [localFocusField, setLocalFocusField] = useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (startEditingField) {
      setEditing(true);
    }
  }, [startEditingField]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const repo = new LocalStorageTradeRepository(undefined, { seedDefaults: false });
        const trades = await repo.getAll();
        if (!mounted) return;
        const found = trades.find((t) => {
          const aid = (t as unknown as { analysisId?: unknown }).analysisId;
          let aidValue: string | undefined;
          if (typeof aid === 'string') aidValue = aid;
          else if (aid && typeof aid === 'object') {
            const maybe = aid as Record<string, unknown>;
            if (typeof maybe.value === 'string') aidValue = maybe.value as string;
            else aidValue = undefined;
          } else aidValue = undefined;
          return aidValue === analysis.id;
        });
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
        <h2
          className={styles.symbol}
          onClick={() => {
            setEditing(true);
            setLocalFocusField('symbol');
            setTimeout(() => setLocalFocusField(undefined), 200);
          }}
          role="button"
          aria-label={`Edit analysis ${analysis.symbol}`}
          style={{ cursor: 'pointer' }}
        >
          {analysis.symbol}
        </h2>
        <div className={styles.actions}>
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
            >
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path
                  d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42L17.59 5H14V3zM5 5h6v2H7v10h10v-4h2v6H5V5z"
                  fill="currentColor"
                />
              </svg>
            </IconButton>
          ) : null}
        </div>
      </div>

      {!editing ? (
        <>
          <div
            className={styles.notes}
            onClick={() => {
              setEditing(true);
              setLocalFocusField('notes');
              setTimeout(() => setLocalFocusField(undefined), 200);
            }}
            role="button"
            aria-label="Edit notes"
            style={{ cursor: 'pointer' }}
          >
            {analysis.notes}
          </div>

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
                {tf.note ? (
                  <p
                    className={styles.tfNote}
                    onClick={() => {
                      setEditing(true);
                      setLocalFocusField(`tf:${tf.timeframe}:note`);
                      setTimeout(() => setLocalFocusField(undefined), 200);
                    }}
                    role="button"
                    aria-label={`Edit ${tf.timeframe} note`}
                    style={{ cursor: 'pointer' }}
                  >
                    {tf.note}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ paddingTop: 8 }}>
          <AnalysisEditor
            initial={{
              symbol: analysis.symbol,
              notes: analysis.notes,
              market: normalizeMarket(
                (analysis as unknown as { market?: 'Forex' | 'Crypto' | { value: string } }).market
              ),
              timeframes: Object.values(analysis.timeframes).reduce(
                (acc: Record<string, TimeframeAnalysis>, tf) => ({
                  ...acc,
                  [tf.timeframe]: tf,
                }),
                {}
              ),
            }}
            // pass focus request down so editor can focus a specific field
            focusField={startEditingField ?? localFocusField}
            onSave={async (values) => {
              // map timeframes array back to record keyed by timeframe
              const tfRecord: Record<Timeframe, TimeframeAnalysis> = (values.timeframes || []).reduce(
                (acc: Record<string, TimeframeAnalysis>, t: TimeframeInput) => ({
                  ...acc,
                  [t.timeframe]: {
                    timeframe: t.timeframe,
                    tradingViewLink: t.tradingViewLink,
                    note: t.note,
                  },
                }),
                {}
              ) as Record<Timeframe, TimeframeAnalysis>;

              const updated: AnalysisDTO = {
                ...analysis,
                symbol: values.symbol ?? analysis.symbol,
                notes: values.notes ?? analysis.notes,
                timeframes: Object.keys(tfRecord).length ? (tfRecord as Record<Timeframe, TimeframeAnalysis>) : analysis.timeframes,
                updatedAt: new Date().toISOString(),
                market:
                  (values.market as 'Forex' | 'Crypto') ??
                  normalizeMarket((analysis as unknown as { market?: 'Forex' | 'Crypto' | { value: string } }).market),
              };
              try {
                if (onSave) await onSave(updated);
              } catch {
                /* ignore */
              }
              setEditing(false);
            }}
          />
          <div style={{ marginTop: 8 }}>
            <Button variant="ghost" onClick={() => setEditing(false)} style={{ marginRight: 8 }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalysisDetail;
