import React, { useEffect, useRef, useState } from 'react';
import styles from './TradeList.module.css';
import { Button } from '@/presentation/shared/components/Button/Button';
import type { TradeRow } from '../types';
import type { TradeQuickAction } from '@/presentation/trade/TradeDetail/TradeDetailEditor';

export type TradeListItem = TradeRow;

type TradeListProps = {
  trades: TradeListItem[];
  selectedId?: string | null;
  onSelect: (id: string, focusField?: string) => void;
  compactView?: boolean;
  onAction?: (action: TradeQuickAction, id: string) => void;
};

const formatNumber = (value?: number | null, options?: Intl.NumberFormatOptions) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '–';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  });
};

const formatPnL = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '–';
  const absolute = Math.abs(value);
  const formatted = formatNumber(absolute, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${value >= 0 ? '+' : '-'}${formatted}`;
};

const formatDate = (iso?: string) => {
  if (!iso) return '–';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

type AnalysisOpenButtonProps = {
  analysisId?: string | null;
  symbol: string;
};

function AnalysisOpenButton({ analysisId, symbol }: AnalysisOpenButtonProps) {
  if (!analysisId) return null;
  return (
    <Button
      variant="ghost"
      className={styles.analysisButton}
      aria-label={`Open analysis for ${symbol}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        try {
          globalThis.location.hash = `#/analysis?id=${encodeURIComponent(analysisId ?? '')}`;
          setTimeout(() => {
            try {
              globalThis.dispatchEvent(new CustomEvent('open-analysis', { detail: { id: analysisId } }));
            } catch {
              /* noop */
            }
          }, 50);
        } catch {
          /* noop */
        }
      }}
    >
      Open analysis
    </Button>
  );
}

type TradeActionsDropdownProps = {
  tradeId: string;
  symbol: string;
  onAction: (action: TradeQuickAction, id: string) => void;
};

function TradeActionsDropdown({ tradeId, symbol, onAction }: TradeActionsDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const menuId = `trade-card-actions-${tradeId}`;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [tradeId]);

  const handleTriggerClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen((prev) => !prev);
  };

  const handleAction = (action: TradeQuickAction, event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onAction(action, tradeId);
    setOpen(false);
  };

  return (
    <div className={styles.cardActionDropdown} ref={dropdownRef}>
      <button
        type="button"
        className={styles.cardActionTrigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Open actions for ${symbol}`}
        data-open={open ? 'true' : undefined}
        onClick={handleTriggerClick}
      >
        <span>Actions</span>
        <span className={styles.cardActionCaret} aria-hidden="true" />
      </button>
      {open ? (
        <div
          className={styles.cardActionMenu}
          role="menu"
          id={menuId}
          aria-label={`Quick actions for ${symbol}`}
        >
          <button
            type="button"
            role="menuitem"
            className={styles.cardActionItem}
            aria-label={`Toggle side for ${symbol}`}
            onClick={(event) => handleAction('toggle-side', event)}
          >
            Toggle side
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.cardActionItem}
            aria-label={`Set SL to BE for ${symbol}`}
            onClick={(event) => handleAction('sl-be', event)}
          >
            SL → B/E
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.cardActionItem}
            aria-label={`Set SL hit for ${symbol}`}
            onClick={(event) => handleAction('sl-hit', event)}
          >
            Mark SL hit
          </button>
          <button
            type="button"
            role="menuitem"
            className={[styles.cardActionItem, styles.cardActionDanger]
              .filter(Boolean)
              .join(' ')}
            aria-label={`Filled ${symbol}`}
            onClick={(event) => handleAction('close', event)}
          >
            Mark filled
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function TradeList({
  trades,
  selectedId,
  onSelect,
  compactView = false,
  onAction,
}: TradeListProps) {
  return (
    <div className={styles.list} role="list" data-compact={compactView || undefined}>
      {trades.length === 0 ? (
        <div className={styles.empty} role="status">
          <div className={styles.emptyTitle}>No trades yet</div>
          <div className={styles.emptyHint}>Create a trade on the right to see it listed here.</div>
        </div>
      ) : (
        trades.map((trade) => {
          const sideRaw = (trade.side || '').toString().trim();
          const normalizedSide = sideRaw.toUpperCase();
          const sideKey = normalizedSide === 'SHORT' || normalizedSide === 'SELL' ? 'SHORT' : 'LONG';
          const statusKey = (trade.status || 'OPEN').toUpperCase();
          const isSelected = selectedId === trade.id;
          const cardClassName = [
            styles.card,
            isSelected ? styles.selected : '',
            compactView ? styles.cardCompact : '',
          ]
            .filter(Boolean)
            .join(' ');

          const metrics: Array<{ label: string; value: string }> = [
            { label: 'Entry Price', value: formatNumber(trade.price, { maximumFractionDigits: 4 }) },
            { label: 'Position Size', value: formatNumber(trade.size) },
            { label: 'Trader', value: trade.userId ?? '–' },
            { label: 'Stop Loss', value: trade.slIsBE ? 'B/E' : formatNumber(trade.sl) },
            { label: 'Margin', value: formatNumber(trade.margin) },
            { label: 'Leverage', value: trade.leverage ? `${formatNumber(trade.leverage)}x` : '–' },
          ];

          const targets = [trade.tp1, trade.tp2, trade.tp3, trade.tp4];
          const pnlState: 'positive' | 'negative' | 'neutral' =
            typeof trade.pnl === 'number'
              ? trade.pnl < 0
                ? 'negative'
                : trade.pnl === 0
                  ? 'neutral'
                  : 'positive'
              : 'neutral';
          const pnlModifier = `pnl${pnlState.charAt(0).toUpperCase()}${pnlState.slice(1)}` as keyof typeof styles;
          const pnlClassName = [styles.pnlChip, styles[pnlModifier] ?? '']
            .filter(Boolean)
            .join(' ');

          return (
            <article
              key={trade.id}
              className={cardClassName}
              aria-label={`Select ${trade.symbol}`}
              role="listitem"
              tabIndex={0}
              data-selected={isSelected || undefined}
              onClick={() => onSelect(trade.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(trade.id);
                }
              }}
            >
            <header className={styles.cardHeader}>
              <div className={styles.titleBlock}>
                <div className={styles.symbol}>{trade.symbol}</div>
                <div className={styles.entryDate}>{formatDate(trade.entryDate)}</div>
              </div>
              <div className={styles.cardHeaderRight}>
                <div className={styles.badges}>
                  <span
                    className={[styles.badge, sideKey === 'LONG' ? styles.badgeLong : styles.badgeShort]
                      .filter(Boolean)
                      .join(' ')}
                    data-side={sideKey}
                  >
                    {sideKey}
                  </span>
                  <span
                    className={[styles.badge, styles[`status${statusKey}` as keyof typeof styles] ?? '']
                      .filter(Boolean)
                      .join(' ')}
                    data-status={statusKey}
                  >
                    {statusKey}
                  </span>
                  <span className={[styles.badge, styles.marketBadge].join(' ')}>{trade.market}</span>
                </div>
                {onAction ? (
                  <TradeActionsDropdown
                    tradeId={trade.id}
                    symbol={trade.symbol ?? ''}
                    onAction={onAction}
                  />
                ) : null}
              </div>
            </header>

            <div className={styles.metaRow}>
              <div className={pnlClassName} data-pnl-sign={pnlState}>
                PnL{' '}
                <span className={styles.pnlValue}>{formatPnL(trade.pnl)}</span>
              </div>
            </div>

            <dl className={styles.metricsGrid}>
              {metrics.map((metric) => (
                <div key={`${trade.id}-${metric.label}`} className={styles.metric}>
                  <dt className={styles.metricLabel}>{metric.label}</dt>
                  <dd className={styles.metricValue}>{metric.value}</dd>
                </div>
              ))}
            </dl>

            <div className={styles.targetsRow} aria-label="Targets overview">
              {targets.map((value, index) => (
                <span key={`${trade.id}-tp-${index + 1}`} className={styles.targetBadge}>
                  {`TP${index + 1}: ${
                    typeof value === 'number' ? formatNumber(value, { maximumFractionDigits: 4 }) : '–'
                  }`}
                </span>
              ))}
              <span className={styles.slBadge}>{`SL: ${trade.slIsBE ? 'B/E' : formatNumber(trade.sl)}`}</span>
            </div>

            {trade.notes ? <p className={styles.notes}>{trade.notes}</p> : null}

            <footer className={styles.cardFooter}>
              <AnalysisOpenButton analysisId={trade.analysisId} symbol={trade.symbol} />
            </footer>
            </article>
          );
        })
      )}
    </div>
  );
}

export default TradeList;
