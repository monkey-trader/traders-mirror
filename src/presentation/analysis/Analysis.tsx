import React, { useState } from 'react';
import styles from './Analysis.module.css';
import { Card } from '@/presentation/shared/components/Card/Card';

export type AnalysisSuggestion = {
  symbol: string;
  price: number;
  size?: number;
  side?: 'LONG' | 'SHORT';
  market?: 'Crypto' | 'Forex' | 'All';
  entryDate?: string;
};

export type AnalysisProps = {
  onCreateTradeSuggestion?: (s: AnalysisSuggestion) => Promise<void> | void;
  compactView?: boolean;
};

export function Analysis({ onCreateTradeSuggestion, compactView = false }: AnalysisProps) {
  const [activeCardTab, setActiveCardTab] = useState('overview');

  const handleCreateExample = async () => {
    if (!onCreateTradeSuggestion) return;
    await onCreateTradeSuggestion({
      symbol: 'EURUSD',
      price: 1.0825,
      size: 10000,
      side: 'LONG',
      market: 'Forex',
      entryDate: new Date().toISOString(),
    });
  };

  return (
    <div
      className={compactView ? `${styles.container} ${styles.compact}` : styles.container}
      data-compact={compactView}
    >
      <h2 className={styles.title}>Marktanalyse</h2>

      <div className={styles.grid}>
        <Card
          title="EUR/USD"
          tabs={[
            {
              key: 'overview',
              title: 'Übersicht',
              render: () => <div>KPIs & Charts (Platzhalter)</div>,
            },
            {
              key: 'trades',
              title: 'Trades',
              render: () => <div>Verlinkte Trades (Platzhalter)</div>,
            },
            { key: 'notes', title: 'Notizen', render: () => <div>Analyse-Notizen</div> },
          ]}
          activeTabKey={activeCardTab}
          onTabChange={setActiveCardTab}
        />

        <Card title="BTC/USD">
          <div>Crypto-Analyse Platzhalter</div>
          {onCreateTradeSuggestion && (
            <div style={{ marginTop: 12 }}>
              <button className={styles.createBtn} onClick={handleCreateExample}>
                Create example trade from analysis
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
