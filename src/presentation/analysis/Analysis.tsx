import React, { useState } from 'react'
import styles from './Analysis.module.css'
import { Card } from '@/presentation/shared/components/Card/Card'

export function Analysis() {
  const [activeCardTab, setActiveCardTab] = useState('overview')

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Marktanalyse</h2>

      <div className={styles.grid}>
        <Card
          title="EUR/USD"
          tabs={[
            { key: 'overview', title: 'Übersicht', render: () => <div>KPIs & Charts (Platzhalter)</div> },
            { key: 'trades', title: 'Trades', render: () => <div>Verlinkte Trades (Platzhalter)</div> },
            { key: 'notes', title: 'Notizen', render: () => <div>Analyse-Notizen</div> },
          ]}
          activeTabKey={activeCardTab}
          onTabChange={setActiveCardTab}
        />

        <Card title="BTC/USD">
          <div>Crypto-Analyse Platzhalter</div>
        </Card>
      </div>
    </div>
  )
}

