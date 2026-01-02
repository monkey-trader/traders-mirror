import React from 'react';
import styles from './AnalysisList.module.css';

export type AnalysisSummary = {
  id: string;
  symbol: string;
  createdAt: string;
  notes?: string;
};

type Props = {
  items?: AnalysisSummary[];
  compactView?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  // legacy prop used by tests / older callers
  onOpen?: (id: string) => void;
};

export function AnalysisList({
  items = [],
  compactView = false,
  selectedId = null,
  onSelect,
  onOpen,
}: Props) {
  if (!items || items.length === 0) {
    return (
      <div className={styles.container} data-testid="analysis-list">
        <div className={styles.empty}>Keine Analysen vorhanden</div>
      </div>
    );
  }

  return (
    <div className={styles.container} data-testid="analysis-list">
      <div className={styles.list} role="list">
        {items.map((it) => {
          const isSelected = selectedId === it.id;
          return (
            <div
              key={it.id}
              data-testid={`analysis-item-${it.id}`}
              role="listitem"
              aria-pressed={isSelected}
              className={[styles.item, compactView ? styles.compact : '', isSelected ? styles.selected : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelect && onSelect(it.id)}
              tabIndex={0}
            >
              <div className={styles.header}>
                <strong className={styles.symbol}>{it.symbol}</strong>
                <button
                  className={styles.openButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpen) onOpen(it.id);
                    if (onSelect) onSelect(it.id);
                  }}
                >
                  Open
                </button>
              </div>
              <div className={styles.meta}>
                <span className={styles.date}>{new Date(it.createdAt).toLocaleString()}</span>
                {it.notes ? <p className={styles.notes}>{it.notes}</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
