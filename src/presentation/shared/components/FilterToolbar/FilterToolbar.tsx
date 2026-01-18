import React from 'react'
import styles from './FilterToolbar.module.css'
import { MarketFilters } from '@/presentation/trade/components/TradeFilters/TradeFilters'
import { Button } from '@/presentation/shared/components/Button/Button'

type Props = {
  title?: string
  count?: number
  countLabel?: string
  showStatusFilters?: boolean
  statusFilters?: React.ReactNode
  hideMarketFilters?: boolean
  tradeStatusFilter?: 'ALL' | 'OPEN' | 'CLOSED' | 'FILLED'
  setTradeStatusFilter?: (s: 'ALL' | 'OPEN' | 'CLOSED' | 'FILLED') => void
  marketFilter: 'All' | 'Crypto' | 'Forex'
  setMarketFilter: (m: 'All' | 'Crypto' | 'Forex') => void
  onCreate?: () => void
  createLabel?: string
  disableCreate?: boolean
  compact?: boolean
}

export function FilterToolbar({
  title,
  count,
  countLabel = 'items',
  showStatusFilters = false,
  statusFilters,
  marketFilter,
  setMarketFilter,
  hideMarketFilters = false,
  onCreate,
  createLabel,
  disableCreate,
  compact = false,
}: Props) {
  return (
    <div className={styles.toolbar} data-compact={compact}>
      {title ? (
        <div className={styles.left}>
          <div className={styles.title}>{title}</div>
          {typeof count === 'number' ? (
            <div className={styles.countBadge}>{count} {countLabel}</div>
          ) : null}
        </div>
      ) : null}

      <div className={styles.right}>
        {showStatusFilters && statusFilters ? <div className={styles.statusWrap}>{statusFilters}</div> : null}

        {!hideMarketFilters ? (
          <div className={styles.marketWrap}>
            <MarketFilters
              marketFilter={marketFilter}
              setMarketFilter={setMarketFilter}
              tradesCount={typeof count === 'number' ? count : 0}
              countLabel={countLabel}
            />
          </div>
        ) : null}

        {onCreate ? (
          <div className={styles.createWrap}>
            <Button type="button" variant="secondary" onClick={onCreate} disabled={disableCreate}>
              {createLabel ?? 'Create'}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default FilterToolbar
