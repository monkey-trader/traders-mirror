import { Button } from '@/presentation/shared/components/Button/Button';
import styles from '../../TradeJournal.module.css';

export type TradeFiltersProps = {
  marketFilter: 'All' | 'Crypto' | 'Forex';
  setMarketFilter: (m: 'All' | 'Crypto' | 'Forex') => void;
  tradeStatusFilter: 'ALL' | 'OPEN' | 'CLOSED' | 'FILLED';
  setTradeStatusFilter: (s: 'ALL' | 'OPEN' | 'CLOSED' | 'FILLED') => void;
  tradesCount?: number;
  countLabel?: string;
};

export function MarketFilters({
  marketFilter,
  setMarketFilter,
  tradesCount = 0,
  countLabel = 'trades',
}: Pick<TradeFiltersProps, 'marketFilter' | 'setMarketFilter' | 'tradesCount' | 'countLabel'>) {
  return (
    <div className={styles.tradesFilters}>
      <Button
        variant={marketFilter === 'All' ? 'primary' : 'ghost'}
        onClick={() => setMarketFilter('All')}
      >
        All
      </Button>
      <Button
        variant={marketFilter === 'Forex' ? 'primary' : 'ghost'}
        onClick={() => setMarketFilter('Forex')}
      >
        Forex
      </Button>
      <Button
        variant={marketFilter === 'Crypto' ? 'primary' : 'ghost'}
        onClick={() => setMarketFilter('Crypto')}
      >
        Crypto
      </Button>
      <div className={styles.tradesCount}>
        {tradesCount} {countLabel}
      </div>
    </div>
  );
}

export function StatusFilters({
  tradeStatusFilter,
  setTradeStatusFilter,
}: Pick<TradeFiltersProps, 'tradeStatusFilter' | 'setTradeStatusFilter'>) {
  return (
    <div className={styles.controls}>
      <Button
        variant={tradeStatusFilter === 'ALL' ? 'primary' : 'ghost'}
        onClick={() => setTradeStatusFilter('ALL')}
      >
        All
      </Button>
      <Button
        variant={tradeStatusFilter === 'OPEN' ? 'primary' : 'ghost'}
        onClick={() => setTradeStatusFilter('OPEN')}
      >
        Open
      </Button>
      <Button
        variant={tradeStatusFilter === 'CLOSED' ? 'primary' : 'ghost'}
        onClick={() => setTradeStatusFilter('CLOSED')}
      >
        Closed
      </Button>
      <Button
        variant={tradeStatusFilter === 'FILLED' ? 'primary' : 'ghost'}
        onClick={() => setTradeStatusFilter('FILLED')}
      >
        Filled
      </Button>
    </div>
  );
}

export default function TradeFilters(props: TradeFiltersProps) {
  // default composition for places that previously relied on the single component
  return (
    <>
      <MarketFilters
        marketFilter={props.marketFilter}
        setMarketFilter={props.setMarketFilter}
        tradesCount={props.tradesCount}
        countLabel={props.countLabel}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <StatusFilters
          tradeStatusFilter={props.tradeStatusFilter}
          setTradeStatusFilter={props.setTradeStatusFilter}
        />
      </div>
    </>
  );
}
