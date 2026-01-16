// Use a lightweight presentation DTO here (avoid coupling to domain TradeInput)
export type TradeListItem = {
  id: string;
  symbol: string;
  entryDate: string;
  size: number;
  price: number;
  side: string;
  status?: string;
  notes?: string;
  tp1?: number;
  tp2?: number;
  tp3?: number;
  tp4?: number;
  sl?: number;
  margin?: number;
  leverage?: number;
  analysisId?: string; // optional link to originating analysis
};

import styles from './TradeList.module.css';
import btnStyles from '@/presentation/shared/components/Button/Button.module.css';
import posStyles from '@/presentation/shared/components/PositionCard/PositionCard.module.css';
import { IconButton } from '@/presentation/shared/components/IconButton/IconButton';
import { PositionCard } from '@/presentation/shared/components/PositionCard/PositionCard';

function AnalysisOpenButton({
  analysisId,
  symbol,
  extraClass,
}: {
  analysisId?: string | null;
  symbol: string;
  extraClass?: string;
}) {
  if (!analysisId) return null;
  const className = [btnStyles.button, extraClass || ''].filter(Boolean).join(' ');
  return (
    <IconButton
      ariaLabel={`Open analysis for ${symbol}`}
      variant="ghost"
      color="primary"
      className={className}
      title="Open analysis"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          globalThis.location.hash = `#/analysis?id=${encodeURIComponent(analysisId ?? '')}`;
          setTimeout(() => {
            try {
              globalThis.dispatchEvent(
                new CustomEvent('open-analysis', { detail: { id: analysisId } })
              );
            } catch {
              /* ignore */
            }
          }, 50);
        } catch {
          /* ignore */
        }
      }}
      icon={
        <svg
          className={styles.analysisIcon}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42L17.59 5H14V3zM5 5h6v2H7v10h10v-4h2v6H5V5z"
            fill="currentColor"
          />
        </svg>
      }
    />
  );
}

export type TradeListProps = {
  trades: TradeListItem[];
  selectedId?: string | null;
  // onSelect can optionally request a field to focus in the detail editor
  onSelect: (id: string, focusField?: string) => void;
  // optional handlers for compact action buttons
  onToggleSide?: (id: string) => void;
  onSetSLtoBE?: (id: string) => void;
  onSetSLHit?: (id: string) => void;
  onClose?: (id: string) => void;
  compactView?: boolean;
};

export function TradeList({
  trades,
  selectedId,
  onSelect,
  compactView = false,
  onToggleSide,
  onSetSLtoBE,
  onSetSLHit,
  onClose,
}: TradeListProps) {
  if (compactView) {
            <div key={t.id} className={styles.compactItem}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <PositionCard
                  id={t.id}
                  symbol={t.symbol}
                  side={sideKey as 'LONG' | 'SHORT'}
                  size={t.size}
                  entry={t.entryDate}
                  pnl={0}
                  onExpand={(id) => onSelect(id)}
                  onToggleSide={(id) => onToggleSide?.(id)}
                  onSetSLtoBE={(id) => onSetSLtoBE?.(id)}
                  onSetSLHit={(id) => onSetSLHit?.(id)}
                  onClose={(id) => onClose?.(id)}
                />
                {t.analysisId ? (
                  <div>
                    <AnalysisOpenButton
                       <div className={[styles.slDisplay, t.sl === 0 ? styles.slZero : styles.slAlert]
                         .filter(Boolean)
                         .join(' ')}
                         style={{ marginLeft: 8 }}
                       >
                         SL: {t.sl ?? '-'}
                       </div>
                      analysisId={t.analysisId}
                      symbol={t.symbol}
                      extraClass={styles.analysisBtn}
                    />
                  </div>
                ) : null}
              </div>
              <div className={styles.tpLevelsCompact}>
                <span>TP1: {t.tp1 ?? '-'}</span> <span>TP2: {t.tp2 ?? '-'}</span>{' '}
                <span>TP3: {t.tp3 ?? '-'}</span> <span>TP4: {t.tp4 ?? '-'}</span>
                <div
                  style={{ marginTop: 6 }}
                  className={t.sl === 0 ? styles.slZero : styles.slAlert}
                >
                  SL: {t.sl ?? '-'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={styles.list} role="list">
      {trades.map((t) => {
        const isSelected = selectedId === t.id;

        // normalize side value to a predictable key and restrict to only 'long' or 'short'
        const rawSide = (t.side || '').toString().replace(/['"`]/g, '').trim().toLowerCase();
        const sideKey = rawSide === 'long' || rawSide === 'buy' ? 'long' : 'short';

        const sideClass = sideKey === 'long' ? styles.sideLong : styles.sideShort;

        const rawStatus = (t.status || '').toString().trim().toUpperCase();
        const statusClass =
          rawStatus === 'OPEN'
            ? styles.statusOpen
            : rawStatus === 'CLOSED'
            ? styles.statusClosed
            : styles.statusFilled;

        return (
          <div
            key={t.id}
            className={[styles.item, isSelected ? styles.selected : ''].filter(Boolean).join(' ')}
            onClick={() => onSelect(t.id)}
            aria-label={`Select ${t.symbol}`}
            role="listitem"
            aria-pressed={isSelected}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                onSelect(t.id);
              }
            }}
          >
            <div className={styles.rowLeft}>
              <div
                className={styles.symbol}
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(t.id, 'symbol');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect(t.id, 'symbol');
                  }
                }}
              >
                {t.symbol}
              </div>
              <div
                className={[styles.slDisplay, t.sl === 0 ? styles.slZero : styles.slAlert]
                  .filter(Boolean)
                  .join(' ')}
                style={{ marginLeft: 8 }}
              >
                SL: {t.sl ?? '-'}
              </div>
              <div
                className={styles.meta}
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(t.id, 'entryDate');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect(t.id, 'entryDate');
                  }
                }}
              >
                {new Date(t.entryDate).toLocaleDateString()}
              </div>
              {/* TP1–TP4 werden hier NICHT mehr angezeigt */}
            </div>
            <div className={styles.rowRight}>
              {t.analysisId ? (
                <div style={{ marginRight: 8 }}>
                  <AnalysisOpenButton
                    analysisId={t.analysisId}
                    symbol={t.symbol}
                    extraClass={styles.analysisBtn}
                  />
                </div>
              ) : null}
              <div
                className={[styles.side, sideClass].join(' ')}
                aria-label={`Side: ${sideKey}`}
                title={sideKey}
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(t.id, 'side');
                }}
              >
                {sideKey.toUpperCase()}
              </div>
              <div
                className={[styles.status, statusClass].join(' ')}
                aria-label={`Status: ${rawStatus}`}
                title={rawStatus}
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(t.id, 'status');
                }}
              >
                {rawStatus || 'UNKNOWN'}
              </div>
              {/* action buttons similar to compact PositionCard (prevent row click propagation) */}
              {(onToggleSide || onSetSLtoBE || onSetSLHit || onClose) && (
                <div className={posStyles.actions} style={{ marginLeft: 8 }}>
                  {onToggleSide && (
                    <button
                      type="button"
                      className={posStyles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSide(t.id);
                      }}
                      aria-label={`Toggle side for ${t.symbol}`}
                    >
                      Side
                    </button>
                  )}
                  {onSetSLtoBE && (
                    <button
                      type="button"
                      className={posStyles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetSLtoBE(t.id);
                      }}
                      aria-label={`Set SL to BE for ${t.symbol}`}
                    >
                      SL‑BE
                    </button>
                  )}
                  {onSetSLHit && (
                    <button
                      type="button"
                      className={posStyles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetSLHit(t.id);
                      }}
                      aria-label={`Set SL hit for ${t.symbol}`}
                    >
                      SL‑HIT
                    </button>
                  )}
                  {onClose && (
                    <button
                      type="button"
                      className={posStyles.closeBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose(t.id);
                      }}
                      aria-label={`Close ${t.symbol}`}
                    >
                      Close
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
