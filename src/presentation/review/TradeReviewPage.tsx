import React from 'react';
import styles from './TradeReviewPage.module.css';

export function TradeReviewPage() {
  // Dummy-Daten für abgeschlossene Trades mit Review-Status
  // Dummy-Daten für abgeschlossene Trades mit Review-Status
  const trades = [
    { id: 1, setup: 'SK Entry', outcome: 'Win', reviewed: false },
    { id: 2, setup: 'Doppelte Vorteil', outcome: 'Loss', reviewed: true },
    { id: 3, setup: 'Fibonacci', outcome: 'Breakeven', reviewed: false },
  ];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Nach-Analyse / Reviews</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Trade #</th>
            <th>Setup</th>
            <th>Outcome</th>
            <th>Review</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id}>
              <td>{trade.id}</td>
              <td>{trade.setup}</td>
              <td>{trade.outcome}</td>
              <td>
                {trade.reviewed ? (
                  <span className={styles.reviewed}>Abgeschlossen</span>
                ) : (
                  <button className={styles.reviewBtn}>Review ausfüllen</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TradeReviewPage;
