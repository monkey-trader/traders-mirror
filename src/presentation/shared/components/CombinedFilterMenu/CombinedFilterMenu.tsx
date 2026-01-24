import React from 'react';
import styles from './CombinedFilterMenu.module.css';
import { Button } from '@/presentation/shared/components/Button/Button';

type Props = {
  marketFilter: 'All' | 'Crypto' | 'Forex';
  setMarketFilter: (m: 'All' | 'Crypto' | 'Forex') => void;
  tradeStatusFilter?: 'ALL' | 'OPEN' | 'CLOSED' | 'FILLED';
  setTradeStatusFilter?: (s: 'ALL' | 'OPEN' | 'CLOSED' | 'FILLED') => void;
};

export function CombinedFilterMenu({
  marketFilter,
  setMarketFilter,
  tradeStatusFilter = 'ALL',
  setTradeStatusFilter,
}: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.statusGroup}>
        <span className={styles.label}>Status</span>
        <div className={styles.pills}>
          {(['ALL', 'OPEN', 'CLOSED', 'FILLED'] as const).map((s) => (
            <Button
              key={s}
              type="button"
              variant={tradeStatusFilter === s ? 'primary' : 'ghost'}
              onClick={() => setTradeStatusFilter?.(s)}
            >
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      <div className={styles.marketGroup}>
        <span className={styles.label}>Market</span>
        <div className={styles.pills}>
          {(['All', 'Forex', 'Crypto'] as const).map((m) => (
            <Button
              key={m}
              type="button"
              variant={marketFilter === m ? 'primary' : 'ghost'}
              onClick={() => setMarketFilter(m)}
            >
              {m}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CombinedFilterMenu;
