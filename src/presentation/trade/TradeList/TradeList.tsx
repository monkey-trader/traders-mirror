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
  pnl?: number;
  tp1?: number;
  tp2?: number;
  tp3?: number;
  tp4?: number;
  sl?: number;
  slIsBE?: boolean;
  margin?: number;
  leverage?: number;
  analysisId?: string; // optional link to originating analysis
};

import styles from './TradeList.module.css';
import btnStyles from '@/presentation/shared/components/Button/Button.module.css';
import { IconButton } from '@/presentation/shared/components/IconButton/IconButton';
import { PositionCard } from '@/presentation/shared/components/PositionCard/PositionCard';
import {
  ActionDropdown,
  type ActionDropdownOption,
} from '@/presentation/shared/components/ActionDropdown/ActionDropdown';

type TradeActionValue =
  | 'toggle-side'
  | 'sl-be'
  | 'status-open'
  | 'status-closed'
  | 'sl-hit'
  | 'tp-1'
  | 'tp-2'
  | 'tp-3'
  | 'tp-4'
  | 'filled';

const formatNumber = (value?: number, digits = 2): string =>
  typeof value === 'number' ? value.toFixed(digits) : '-';

const formatLeverage = (value?: number): string => {
  if (typeof value !== 'number') return '-';
  const fractionDigits = Number.isInteger(value) ? 0 : 1;
  return `${value.toFixed(fractionDigits)}x`;
};

const formatSize = (value?: number): string =>
  typeof value === 'number' ? value.toString() : '-';

type MetricAccent = 'positive' | 'negative';

type MetricDisplay = {
  label: string;
  value: string;
  accent?: MetricAccent;
};

const buildSLMetric = (sl?: number, slIsBE?: boolean): MetricDisplay => {
  const hasNumber = typeof sl === 'number';
  const accent: MetricAccent | undefined = slIsBE
    ? 'positive'
    : hasNumber
    ? sl === 0
      ? 'positive'
      : 'negative'
    : undefined;

  const value = slIsBE ? '0.0' : formatNumber(sl, 2);

  return {
    label: 'SL',
    value,
    accent,
  };
};

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
  onSetTPHit?: (id: string, tpIndex: 1 | 2 | 3 | 4) => void;
  onMarkClosed?: (id: string) => void;
  onMarkOpen?: (id: string) => void;
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
  onSetTPHit,
  onMarkClosed,
  onMarkOpen,
  onClose,
}: TradeListProps) {
  const metricClassName = (accent?: MetricAccent): string =>
    [
      styles.metricItem,
      accent === 'positive' ? styles.metricPositive : '',
      accent === 'negative' ? styles.metricNegative : '',
    ]
      .filter(Boolean)
      .join(' ');

  if (compactView) {
    return (
      <div className={styles.list} role="list">
        {trades.map((t) => {
          const sideRaw = (t.side || '').toString().replace(/['"`]/g, '').trim();
          const sideKey =
            sideRaw.toUpperCase() === 'LONG' || sideRaw.toLowerCase() === 'buy' ? 'LONG' : 'SHORT';
          const slMetric = buildSLMetric(t.sl, t.slIsBE);
          const primaryMetrics: MetricDisplay[] = [
            slMetric,
            { label: 'PnL', value: formatNumber(t.pnl, 2) },
            { label: 'Entry', value: formatNumber(t.price, 4) },
            { label: 'Size', value: formatSize(t.size) },
            { label: 'Margin', value: formatNumber(t.margin, 2) },
            { label: 'Leverage', value: formatLeverage(t.leverage) },
          ];
          const secondaryMetrics: MetricDisplay[] = [
            { label: 'TP1', value: formatNumber(t.tp1, 2) },
            { label: 'TP2', value: formatNumber(t.tp2, 2) },
            { label: 'TP3', value: formatNumber(t.tp3, 2) },
            { label: 'TP4', value: formatNumber(t.tp4, 2) },
          ];
          return (
            <div key={t.id} className={styles.compactItem}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <PositionCard
                  id={t.id}
                  symbol={t.symbol}
                  side={sideKey as 'LONG' | 'SHORT'}
                  size={t.size}
                  entry={t.entryDate}
                  pnl={typeof t.pnl === 'number' ? t.pnl : 0}
                  onExpand={(id) => onSelect(id)}
                  onToggleSide={onToggleSide}
                  onSetSLtoBE={onSetSLtoBE}
                  onSetSLHit={onSetSLHit}
                  onSetTPHit={onSetTPHit}
                  onMarkClosed={onMarkClosed}
                  onMarkOpen={onMarkOpen}
                  onClose={onClose}
                />
                {t.analysisId ? (
                  <div>
                    <AnalysisOpenButton
                      analysisId={t.analysisId}
                      symbol={t.symbol}
                      extraClass={styles.analysisBtn}
                    />
                  </div>
                ) : null}
              </div>
              <div className={styles.tpLevelsCompact}>
                <div className={`${styles.metrics} ${styles.metricsCompact}`}>
                  {primaryMetrics.map((metric) => (
                    <span key={`${t.id}-${metric.label}`} className={metricClassName(metric.accent)}>
                      <span className={styles.metricLabel}>{metric.label}</span>
                      <span className={styles.metricValue}>{metric.value}</span>
                    </span>
                  ))}
                </div>
                <div className={`${styles.metrics} ${styles.metricsCompact}`}>
                  {secondaryMetrics.map((metric) => (
                    <span key={`${t.id}-${metric.label}`} className={metricClassName(metric.accent)}>
                      <span className={styles.metricLabel}>{metric.label}</span>
                      <span className={styles.metricValue}>{metric.value}</span>
                    </span>
                  ))}
                </div>
                <div className={styles.tpMetaDate}>
                  {new Date(t.entryDate).toLocaleDateString()}
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

        const slMetric = buildSLMetric(t.sl, t.slIsBE);
        const detailMetrics: MetricDisplay[] = [
          slMetric,
          { label: 'PnL', value: formatNumber(t.pnl, 2) },
          { label: 'Entry', value: formatNumber(t.price, 4) },
          { label: 'Size', value: formatSize(t.size) },
          { label: 'Margin', value: formatNumber(t.margin, 2) },
          { label: 'Leverage', value: formatLeverage(t.leverage) },
          { label: 'TP1', value: formatNumber(t.tp1, 2) },
          { label: 'TP2', value: formatNumber(t.tp2, 2) },
          { label: 'TP3', value: formatNumber(t.tp3, 2) },
          { label: 'TP4', value: formatNumber(t.tp4, 2) },
        ];

        const optionMap: Partial<Record<TradeActionValue, ActionDropdownOption>> = {};
        if (onToggleSide) {
          const targetSide = sideKey === 'long' ? 'SHORT' : 'LONG';
          optionMap['toggle-side'] = {
            value: 'toggle-side',
            label: `Switch to ${targetSide}`,
            onSelect: () => onToggleSide(t.id),
          };
        }
        if (onSetSLtoBE) {
          optionMap['sl-be'] = {
            value: 'sl-be',
            label: 'Set SL to BE',
            onSelect: () => onSetSLtoBE(t.id),
          };
        }
        if (onMarkOpen) {
          optionMap['status-open'] = {
            value: 'status-open',
            label: 'Mark OPEN',
            onSelect: () => onMarkOpen(t.id),
          };
        }
        if (onMarkClosed) {
          optionMap['status-closed'] = {
            value: 'status-closed',
            label: 'Mark CLOSED',
            onSelect: () => onMarkClosed(t.id),
          };
        }
        if (onSetSLHit) {
          optionMap['sl-hit'] = {
            value: 'sl-hit',
            label: 'Mark SL hit',
            onSelect: () => onSetSLHit(t.id),
          };
        }
        if (onSetTPHit) {
          (['1', '2', '3', '4'] as const).forEach((target) => {
            const idx = Number(target) as 1 | 2 | 3 | 4;
            const value = `tp-${target}` as TradeActionValue;
            optionMap[value] = {
              value,
              label: `Mark TP${target} hit`,
              onSelect: () => onSetTPHit(t.id, idx),
            };
          });
        }
        if (onClose) {
          optionMap.filled = {
            value: 'filled',
            label: 'Mark FILLED',
            onSelect: () => onClose(t.id),
          };
        }

        const orderedKeys: TradeActionValue[] = [
          'sl-be',
          'sl-hit',
          'tp-1',
          'tp-2',
          'tp-3',
          'tp-4',
          'status-open',
          'status-closed',
          'filled',
          'toggle-side',
        ];
        const actionOptions = orderedKeys
          .map((key) => optionMap[key])
          .filter((opt): opt is ActionDropdownOption => Boolean(opt));

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
              <div className={styles.metrics} role="group" aria-label={`Kennzahlen für ${t.symbol}`}>
                {detailMetrics.map((metric) => (
                  <span key={`${t.id}-${metric.label}`} className={metricClassName(metric.accent)}>
                    <span className={styles.metricLabel}>{metric.label}</span>
                    <span className={styles.metricValue}>{metric.value}</span>
                  </span>
                ))}
              </div>
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
              {actionOptions.length > 0 && (
                <div
                  className={styles.actionDropdownWrap}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <ActionDropdown
                    options={actionOptions}
                    ariaLabel={`Aktionen für ${t.symbol}`}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
