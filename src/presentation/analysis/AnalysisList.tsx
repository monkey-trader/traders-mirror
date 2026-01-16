import React from 'react';
import { Button } from '@/presentation/shared/components/Button/Button';
import styles from './AnalysisList.module.css';

export type AnalysisSummary = {
  id: string;
  symbol: string;
  createdAt: string;
  notes?: string;
  market?: 'Forex' | 'Crypto' | 'All';
};

type Props = {
  items?: AnalysisSummary[];
  compactView?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string, focusField?: string) => void;
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
              className={[
                styles.item,
                compactView ? styles.compact : '',
                isSelected ? styles.selected : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                if (onSelect) onSelect(it.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (onSelect) onSelect(it.id);
                }
              }}
              tabIndex={0}
            >
              <div className={styles.header}>
                <strong
                  className={styles.symbol}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelect) onSelect(it.id, 'symbol');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      if (onSelect) onSelect(it.id, 'symbol');
                    }
                  }}
                >
                  {it.symbol}
                </strong>
                <div className={styles.headerActions}>
                  <Button
                    variant="ghost"
                    className={styles.actionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpen) onOpen(it.id);
                      if (onSelect) onSelect(it.id);
                    }}
                  >
                    Open
                  </Button>
                  {/* Delete moved to detail view; row-level delete removed */}
                </div>
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
