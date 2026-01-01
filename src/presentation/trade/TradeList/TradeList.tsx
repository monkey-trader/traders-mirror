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
  analysisId?: string; // optional link to originating analysis
};

import styles from './TradeList.module.css';
import { PositionCard } from '@/presentation/shared/components/PositionCard/PositionCard';

export type TradeListProps = {
  trades: TradeListItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
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
    return (
      <div className={styles.list} role="list">
        {trades.map((t) => {
          const sideKey =
            (t.side || '').toString().trim().toUpperCase() === 'LONG' ||
            (t.side || '').toString().trim().toLowerCase() === 'buy'
              ? 'LONG'
              : 'SHORT';
          return (
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
                  <button
                    type="button"
                    title="Open analysis"
                    aria-label={`Open analysis for ${t.symbol}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      try {
                        window.location.hash = '#/analysis';
                        window.dispatchEvent(
                          new CustomEvent('open-analysis', { detail: { id: t.analysisId } })
                        );
                      } catch {
                        /* ignore */
                      }
                    }}
                    style={{ height: 28, padding: '4px 8px', borderRadius: 6 }}
                  >
                    A
                  </button>
                ) : null}
              </div>
              <div className={styles.tpLevelsCompact}>
                <span>TP1: {t.tp1 ?? '-'}</span> <span>TP2: {t.tp2 ?? '-'}</span>{' '}
                <span>TP3: {t.tp3 ?? '-'}</span> <span>TP4: {t.tp4 ?? '-'}</span>
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
        const rawSide = (t.side || '').toString().trim().toLowerCase();
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
          <button
            key={t.id}
            className={[styles.item, isSelected ? styles.selected : ''].filter(Boolean).join(' ')}
            onClick={() => onSelect(t.id)}
            aria-label={`Select ${t.symbol}`}
            role="listitem"
            aria-pressed={isSelected}
          >
            <div className={styles.rowLeft}>
              <div className={styles.symbol}>{t.symbol}</div>
              <div className={styles.meta}>{new Date(t.entryDate).toLocaleDateString()}</div>
              {/* TP1–TP4 werden hier NICHT mehr angezeigt */}
            </div>
            <div className={styles.rowRight}>
              <div
                className={[styles.side, sideClass].join(' ')}
                aria-label={`Side: ${sideKey}`}
                title={sideKey}
              >
                {sideKey.toUpperCase()}
              </div>
              <div
                className={[styles.status, statusClass].join(' ')}
                aria-label={`Status: ${rawStatus}`}
                title={rawStatus}
              >
                {rawStatus || 'UNKNOWN'}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
