import React from 'react';
import styles from './PositionCard.module.css';
import { ActionDropdown, type ActionDropdownOption } from '../ActionDropdown/ActionDropdown';

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

export type PositionCardProps = {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: number;
  entry?: string;
  sl?: string;
  pnl: number;
  onExpand?: (id: string) => void;
  onToggleSide?: (id: string) => void;
  onClose?: (id: string) => void;
  onSetSLtoBE?: (id: string) => void;
  onSetSLHit?: (id: string) => void;
  onSetTPHit?: (id: string, tpIndex: 1 | 2 | 3 | 4) => void;
  onMarkClosed?: (id: string) => void;
  onMarkOpen?: (id: string) => void;
};

export function PositionCard({
  id,
  symbol,
  side,
  size,
  entry,
  sl,
  pnl,
  onExpand,
  onToggleSide,
  onClose,
  onSetSLtoBE,
  onSetSLHit,
  onSetTPHit,
  onMarkClosed,
  onMarkOpen,
}: PositionCardProps) {
  const sideClass = side === 'LONG' ? styles.sideLong : styles.sideShort;
  const optionMap: Partial<Record<TradeActionValue, ActionDropdownOption>> = {};

  if (onToggleSide) {
    const targetSide = side === 'LONG' ? 'SHORT' : 'LONG';
    optionMap['toggle-side'] = {
      value: 'toggle-side',
      label: `Switch to ${targetSide}`,
      onSelect: () => onToggleSide(id),
    };
  }

  if (onSetSLtoBE) {
    optionMap['sl-be'] = {
      value: 'sl-be',
      label: 'Set SL to BE',
      onSelect: () => onSetSLtoBE(id),
    };
  }

  if (onMarkOpen) {
    optionMap['status-open'] = {
      value: 'status-open',
      label: 'Mark OPEN',
      onSelect: () => onMarkOpen(id),
    };
  }

  if (onMarkClosed) {
    optionMap['status-closed'] = {
      value: 'status-closed',
      label: 'Mark CLOSED',
      onSelect: () => onMarkClosed(id),
    };
  }

  if (onSetSLHit) {
    optionMap['sl-hit'] = {
      value: 'sl-hit',
      label: 'Mark SL hit',
      onSelect: () => onSetSLHit(id),
    };
  }

  if (onSetTPHit) {
    (['1', '2', '3', '4'] as const).forEach((target) => {
      const idx = Number(target) as 1 | 2 | 3 | 4;
      const value = `tp-${target}` as TradeActionValue;
      optionMap[value] = {
        value,
        label: `Mark TP${target} hit`,
        onSelect: () => onSetTPHit(id, idx),
      };
    });
  }

  if (onClose) {
    optionMap.filled = {
      value: 'filled',
      label: 'Mark FILLED',
      onSelect: () => onClose(id),
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
    <div className={styles.card} role="group" aria-labelledby={`pos-${id}-symbol`}>
      <div className={styles.left}>
        <div id={`pos-${id}-symbol`} className={styles.symbol}>
          {symbol}
        </div>
        <div className={[styles.meta, sideClass].filter(Boolean).join(' ')}>
          {side} · {size}
        </div>
        {entry && <div className={styles.small}>Entry: {entry}</div>}
        {sl && <div className={styles.small}>SL: {sl}</div>}
      </div>
      <div className={styles.right}>
        <div className={pnl >= 0 ? styles.pnlPositive : styles.pnlNegative}>{pnl.toFixed(2)}</div>
        <div className={styles.actions}>
          {actionOptions.length > 0 && (
            <ActionDropdown
              options={actionOptions}
              ariaLabel={`Aktionen für ${symbol}`}
              size="compact"
            />
          )}
          <button
            type="button"
            className={styles.expandBtn}
            onClick={() => onExpand?.(id)}
            aria-label={`Toggle details for ${symbol}`}
          >
            ▸
          </button>
        </div>
      </div>
    </div>
  );
}
