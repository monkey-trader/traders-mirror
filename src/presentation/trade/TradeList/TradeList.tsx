// Use a lightweight presentation DTO here (avoid coupling to domain TradeInput)
export type TradeListItem = {
  id: string;
  symbol: string;
  entryDate: string;
  size: number;
  price: number;
  side: string;
  market?: 'Crypto' | 'Forex' | 'All' | string;
  status?: string;
  notes?: string;
  pnl?: number;
  tp1?: number;
  tp2?: number;
  tp3?: number;
  tp4?: number;
  tp1IsHit?: boolean;
  tp2IsHit?: boolean;
  tp3IsHit?: boolean;
  tp4IsHit?: boolean;
  sl?: number;
  slIsBE?: boolean;
  margin?: number;
  leverage?: number;
  analysisId?: string; // optional link to originating analysis
};

import { useEffect, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react';
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

const numericEditableFields: ReadonlySet<FocusField> = new Set<FocusField>([
  'price',
  'size',
  'sl',
  'tp1',
  'tp2',
  'tp3',
  'tp4',
  'margin',
  'leverage',
]);

const metricSteps: Partial<Record<FocusField, string>> = {
  price: '0.0001',
  size: '0.01',
  sl: '0.0001',
  tp1: '0.0001',
  tp2: '0.0001',
  tp3: '0.0001',
  tp4: '0.0001',
  margin: '0.01',
  leverage: '0.1',
};

export type FocusField =
  | 'entryDate'
  | 'size'
  | 'price'
  | 'sl'
  | 'tp1'
  | 'tp2'
  | 'tp3'
  | 'tp4'
  | 'margin'
  | 'leverage';

type MetricDisplay = {
  label: string;
  value: string;
  rawValue?: number | string;
  accent?: MetricAccent;
  focusField?: FocusField;
  inputType?: 'number' | 'text' | 'datetime-local';
  step?: string;
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
    focusField: 'sl',
    rawValue: slIsBE ? 0 : sl,
    inputType: 'number',
    step: '0.0001',
  };
};

const dispatchPrefillAnalysis = (trade: TradeListItem) => {
  try {
    const marketValue =
      trade.market === 'Forex' || trade.market === 'Crypto' ? trade.market : undefined;
    globalThis.dispatchEvent(
      new CustomEvent('prefill-analysis', {
        detail: {
          tradeId: trade.id,
          symbol: trade.symbol,
          notes: trade.notes,
          market: marketValue,
        },
      })
    );
  } catch {
    /* ignore */
  }
};

function AnalysisActionButton({ trade, extraClass }: { trade: TradeListItem; extraClass?: string }) {
  const className = [btnStyles.button, extraClass || ''].filter(Boolean).join(' ');
  const hasAnalysis = Boolean(trade.analysisId);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (hasAnalysis && trade.analysisId) {
      try {
        globalThis.location.hash = `#/analysis?id=${encodeURIComponent(trade.analysisId)}`;
        setTimeout(() => {
          try {
            globalThis.dispatchEvent(
              new CustomEvent('open-analysis', { detail: { id: trade.analysisId } })
            );
          } catch {
            /* ignore */
          }
        }, 50);
      } catch {
        /* ignore */
      }
      return;
    }
    dispatchPrefillAnalysis(trade);
  };

  const icon = hasAnalysis ? (
    <svg className={styles.analysisIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M9.5 14.5 8.1 15.9a3 3 0 1 1-4.2-4.2l3-3a3 3 0 0 1 4.2 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m14.5 9.5 1.4-1.4a3 3 0 0 1 4.2 4.2l-3 3a3 3 0 0 1-4.2 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 15 15 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg className={styles.analysisIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor" />
    </svg>
  );

  return (
    <IconButton
      ariaLabel={`${hasAnalysis ? 'Open' : 'Create'} analysis for ${trade.symbol}`}
      variant="ghost"
      color="primary"
      className={className}
      title={hasAnalysis ? 'Open analysis' : 'Create analysis'}
      data-testid={`create-analysis-${trade.id}`}
      icon={icon}
      onClick={handleClick}
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
  onDelete?: (id: string) => void;
  onInlineUpdate?: (id: string, field: FocusField, value: number | string | undefined) => void;
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
  onDelete,
  onInlineUpdate,
}: TradeListProps) {
  const metricClassName = (accent?: MetricAccent): string =>
    [
      styles.metricItem,
      accent === 'positive' ? styles.metricPositive : '',
      accent === 'negative' ? styles.metricNegative : '',
    ]
      .filter(Boolean)
      .join(' ');

  const [editing, setEditing] = useState<{ id: string; field: FocusField; value: string } | null>(
    null
  );

  useEffect(() => {
    if (!editing) return;
    const stillExists = trades.some((trade) => trade.id === editing.id);
    if (!stillExists) setEditing(null);
  }, [editing, trades]);

  const parseValueForField = (field: FocusField, value: string): number | string | undefined => {
    if (numericEditableFields.has(field)) {
      if (value.trim() === '') return undefined;
      const parsed = Number(value);
      if (Number.isNaN(parsed)) return undefined;
      return parsed;
    }
    if (field === 'entryDate') {
      return value;
    }
    return value;
  };

  const commitInlineEdit = () => {
    if (!editing) return;
    if (!onInlineUpdate) {
      setEditing(null);
      return;
    }
    const parsed = parseValueForField(editing.field, editing.value);
    onInlineUpdate(editing.id, editing.field, parsed);
    setEditing(null);
  };

  const cancelInlineEdit = () => setEditing(null);

  const startInlineEdit = (tradeId: string, field: FocusField, rawValue?: number | string) => {
    const initialValue =
      rawValue === undefined || rawValue === null ? '' : typeof rawValue === 'number' ? `${rawValue}` : rawValue;
    setEditing({ id: tradeId, field, value: initialValue });
  };

  const handleInlineInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setEditing((prev) => (prev ? { ...prev, value: next } : prev));
  };

  const handleInlineInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitInlineEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelInlineEdit();
    }
  };

  const renderMetricTile = (
    trade: TradeListItem,
    metric: MetricDisplay,
    className: string,
    interactive: boolean
  ) => {
    const isEditingMetric =
      interactive && editing && editing.id === trade.id && editing.field === metric.focusField;

    if (isEditingMetric && metric.focusField) {
      const inputType = metric.inputType ?? (numericEditableFields.has(metric.focusField) ? 'number' : 'text');
      const ariaLabel = `${metric.label} editor for ${trade.symbol}`;
      return (
        <span key={`${trade.id}-${metric.label}`} className={`${className} ${styles.metricEditing}`}>
          <span className={styles.metricLabel}>{metric.label}</span>
          <input
            autoFocus
            aria-label={ariaLabel}
            className={styles.metricInput}
            type={inputType}
            value={editing?.value ?? ''}
            onChange={handleInlineInputChange}
            onKeyDown={handleInlineInputKeyDown}
            onBlur={commitInlineEdit}
            step={inputType === 'number' ? metric.step : undefined}
          />
        </span>
      );
    }

    return (
      <span
        key={`${trade.id}-${metric.label}`}
        className={className}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? `Edit ${metric.label}` : undefined}
        onClick={(event) => interactive && handleMetricClick(event, trade.id, metric)}
        onKeyDown={(event) => interactive && handleMetricKeyDown(event, trade.id, metric)}
      >
        <span className={styles.metricLabel}>{metric.label}</span>
        <span className={styles.metricValue}>{metric.value}</span>
      </span>
    );
  };

  const handleMetricClick = (
    event: MouseEvent<HTMLSpanElement>,
    tradeId: string,
    metric: MetricDisplay
  ) => {
    if (!metric.focusField) return;
    event.stopPropagation();
    onSelect(tradeId, metric.focusField);
    startInlineEdit(tradeId, metric.focusField, metric.rawValue);
  };

  const handleMetricKeyDown = (
    event: KeyboardEvent<HTMLSpanElement>,
    tradeId: string,
    metric: MetricDisplay
  ) => {
    if (!metric.focusField) return;
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      event.stopPropagation();
      onSelect(tradeId, metric.focusField);
      startInlineEdit(tradeId, metric.focusField, metric.rawValue);
    }
  };

  if (compactView) {
    return (
      <div className={styles.list} role="list">
        {trades.map((t) => {
          const sideRaw = (t.side || '').toString().replace(/['"`]/g, '').trim();
          const sideKey =
            sideRaw.toUpperCase() === 'LONG' || sideRaw.toLowerCase() === 'buy' ? 'LONG' : 'SHORT';
          const slMetric = buildSLMetric(t.sl, t.slIsBE);
          const tpHitFlags: Record<1 | 2 | 3 | 4, boolean> = {
            1: Boolean(t.tp1IsHit),
            2: Boolean(t.tp2IsHit),
            3: Boolean(t.tp3IsHit),
            4: Boolean(t.tp4IsHit),
          };
          const primaryMetrics: MetricDisplay[] = [
            slMetric,
            { label: 'PnL', value: formatNumber(t.pnl, 2) },
            {
              label: 'Entry',
              value: formatNumber(t.price, 4),
              focusField: 'price',
              rawValue: t.price,
              inputType: 'number',
              step: metricSteps.price,
            },
            {
              label: 'Size',
              value: formatSize(t.size),
              focusField: 'size',
              rawValue: t.size,
              inputType: 'number',
              step: metricSteps.size,
            },
            {
              label: 'Margin',
              value: formatNumber(t.margin, 2),
              focusField: 'margin',
              rawValue: t.margin,
              inputType: 'number',
              step: metricSteps.margin,
            },
            {
              label: 'Leverage',
              value: formatLeverage(t.leverage),
              focusField: 'leverage',
              rawValue: t.leverage,
              inputType: 'number',
              step: metricSteps.leverage,
            },
          ];
          const secondaryMetrics: MetricDisplay[] = [
            {
              label: 'TP1',
              value: formatNumber(t.tp1, 2),
              focusField: 'tp1',
              rawValue: t.tp1,
              inputType: 'number',
              step: metricSteps.tp1,
              accent: tpHitFlags[1] ? 'positive' : undefined,
            },
            {
              label: 'TP2',
              value: formatNumber(t.tp2, 2),
              focusField: 'tp2',
              rawValue: t.tp2,
              inputType: 'number',
              step: metricSteps.tp2,
              accent: tpHitFlags[2] ? 'positive' : undefined,
            },
            {
              label: 'TP3',
              value: formatNumber(t.tp3, 2),
              focusField: 'tp3',
              rawValue: t.tp3,
              inputType: 'number',
              step: metricSteps.tp3,
              accent: tpHitFlags[3] ? 'positive' : undefined,
            },
            {
              label: 'TP4',
              value: formatNumber(t.tp4, 2),
              focusField: 'tp4',
              rawValue: t.tp4,
              inputType: 'number',
              step: metricSteps.tp4,
              accent: tpHitFlags[4] ? 'positive' : undefined,
            },
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
                  onDelete={onDelete}
                  tp1IsHit={t.tp1IsHit}
                  tp2IsHit={t.tp2IsHit}
                  tp3IsHit={t.tp3IsHit}
                  tp4IsHit={t.tp4IsHit}
                />
                <div>
                  <AnalysisActionButton trade={t} extraClass={styles.analysisBtn} />
                </div>
              </div>
              <div className={styles.tpLevelsCompact}>
                <div className={`${styles.metrics} ${styles.metricsCompact}`}>
                  {primaryMetrics.map((metric) => {
                    const interactive = Boolean(metric.focusField);
                    const className = [
                      metricClassName(metric.accent),
                      interactive ? styles.metricInteractive : '',
                    ]
                      .filter(Boolean)
                      .join(' ');
                    return renderMetricTile(t, metric, className, interactive);
                  })}
                </div>
                <div className={`${styles.metrics} ${styles.metricsCompact}`}>
                  {secondaryMetrics.map((metric) => {
                    const interactive = Boolean(metric.focusField);
                    const className = [
                      metricClassName(metric.accent),
                      interactive ? styles.metricInteractive : '',
                    ]
                      .filter(Boolean)
                      .join(' ');
                    return renderMetricTile(t, metric, className, interactive);
                  })}
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
        const tpHitFlags: Record<1 | 2 | 3 | 4, boolean> = {
          1: Boolean(t.tp1IsHit),
          2: Boolean(t.tp2IsHit),
          3: Boolean(t.tp3IsHit),
          4: Boolean(t.tp4IsHit),
        };
        const detailMetrics: MetricDisplay[] = [
          slMetric,
          { label: 'PnL', value: formatNumber(t.pnl, 2) },
          {
            label: 'Entry',
            value: formatNumber(t.price, 4),
            focusField: 'price',
            rawValue: t.price,
            inputType: 'number',
            step: metricSteps.price,
          },
          {
            label: 'Size',
            value: formatSize(t.size),
            focusField: 'size',
            rawValue: t.size,
            inputType: 'number',
            step: metricSteps.size,
          },
          {
            label: 'Margin',
            value: formatNumber(t.margin, 2),
            focusField: 'margin',
            rawValue: t.margin,
            inputType: 'number',
            step: metricSteps.margin,
          },
          {
            label: 'Leverage',
            value: formatLeverage(t.leverage),
            focusField: 'leverage',
            rawValue: t.leverage,
            inputType: 'number',
            step: metricSteps.leverage,
          },
          {
            label: 'TP1',
            value: formatNumber(t.tp1, 2),
            focusField: 'tp1',
            rawValue: t.tp1,
            inputType: 'number',
            step: metricSteps.tp1,
            accent: tpHitFlags[1] ? 'positive' : undefined,
          },
          {
            label: 'TP2',
            value: formatNumber(t.tp2, 2),
            focusField: 'tp2',
            rawValue: t.tp2,
            inputType: 'number',
            step: metricSteps.tp2,
            accent: tpHitFlags[2] ? 'positive' : undefined,
          },
          {
            label: 'TP3',
            value: formatNumber(t.tp3, 2),
            focusField: 'tp3',
            rawValue: t.tp3,
            inputType: 'number',
            step: metricSteps.tp3,
            accent: tpHitFlags[3] ? 'positive' : undefined,
          },
          {
            label: 'TP4',
            value: formatNumber(t.tp4, 2),
            focusField: 'tp4',
            rawValue: t.tp4,
            inputType: 'number',
            step: metricSteps.tp4,
            accent: tpHitFlags[4] ? 'positive' : undefined,
          },
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
            variant: 'success',
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
            const isCurrentlyHit = tpHitFlags[idx];
            optionMap[value] = {
              value,
              label: isCurrentlyHit ? `Clear TP${target} hit` : `Mark TP${target} hit`,
              onSelect: () => onSetTPHit(t.id, idx),
              variant: isCurrentlyHit ? undefined : 'success',
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
                {t.analysisId && (
                  <span className={styles.analysisLinkBadge} title="Analysis linked" aria-hidden>
                    <svg
                      className={styles.analysisLinkIcon}
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9.5 14.5 8.1 15.9a3 3 0 1 1-4.2-4.2l3-3a3 3 0 0 1 4.2 0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="m14.5 9.5 1.4-1.4a3 3 0 0 1 4.2 4.2l-3 3a3 3 0 0 1-4.2 0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 15 15 9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
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
                {detailMetrics.map((metric) => {
                  const interactive = Boolean(metric.focusField);
                  const className = [
                    metricClassName(metric.accent),
                    interactive ? styles.metricInteractive : '',
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return renderMetricTile(t, metric, className, interactive);
                })}
              </div>
            </div>
            <div className={styles.rowRight}>
              <div style={{ marginRight: 8 }}>
                <AnalysisActionButton trade={t} extraClass={styles.analysisBtn} />
              </div>
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
              {onDelete && (
                <IconButton
                  ariaLabel={`Delete ${t.symbol}`}
                  title="Delete trade"
                  variant="ghost"
                  className={styles.deleteBtn}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(t.id);
                  }}
                  onKeyDown={(event) => {
                    event.stopPropagation();
                  }}
                  icon={
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path
                        d="M6 6 18 18M18 6 6 18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                      />
                    </svg>
                  }
                />
              )}
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
