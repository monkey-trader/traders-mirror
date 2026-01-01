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
  onOpen?: (id: string) => void;
};

export function AnalysisList({ items = [], compactView = false, onOpen }: Props) {
  return (
    <div className={styles.container} data-testid="analysis-list">
      {items.length === 0 ? (
        <div className={styles.empty}>Keine Analysen vorhanden</div>
      ) : (
        <ul className={styles.list}>
          {items.map((it) => (
            <li
              key={it.id}
              className={`${styles.item} ${compactView ? styles.compact : ''}`}
              data-testid={`analysis-item-${it.id}`}
            >
              <div className={styles.header}>
                <strong className={styles.symbol}>{it.symbol}</strong>
                <button className={styles.openButton} onClick={() => onOpen && onOpen(it.id)}>
                  Open
                </button>
              </div>
              <div className={styles.meta}>
                <span className={styles.date}>{new Date(it.createdAt).toLocaleString()}</span>
                {it.notes ? <p className={styles.notes}>{it.notes}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
