import React, { useState } from 'react';
import { Button } from '@/presentation/shared/components/Button/Button';
import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository';
import type { TradeRow } from '../../types';
import {
  COMBINED_MOCK_TRADES,
  MORE_CRYPTO_MOCK_TRADES,
  MORE_FOREX_MOCK_TRADES,
} from '@/infrastructure/trade/repositories/mockData';
import { loadMockTrades } from '../../mockLoader';
import { loadExplicitAnalyses } from '@/presentation/analysis/mockLoader';
import { AnalysisService } from '@/application/analysis/services/AnalysisService';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';
import styles from '../../TradeJournal.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
  repoRef: React.MutableRefObject<TradeRepository | null>;
  setPositions: React.Dispatch<React.SetStateAction<TradeRow[]>>;
  analysisService: AnalysisService;
};

export function MockLoaderModal({ open, onClose, repoRef, setPositions, analysisService }: Props) {
  const [mockLoadOption, setMockLoadOption] = useState<'crypto' | 'forex' | 'both'>('both');
  const [mockLoading, setMockLoading] = useState(false);

  if (!open) return null;

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.mockDialog}>
        <h3>Lade Mock-Daten</h3>
        <p>
          Wähle welches Set an Testdaten du laden möchtest. Bereits vorhandene Daten bleiben
          erhalten.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 12 }}>
          <Button
            variant={mockLoadOption === 'crypto' ? 'primary' : 'ghost'}
            onClick={() => setMockLoadOption('crypto')}
          >
            Crypto
          </Button>
          <Button
            variant={mockLoadOption === 'forex' ? 'primary' : 'ghost'}
            onClick={() => setMockLoadOption('forex')}
          >
            Forex
          </Button>
          <Button
            variant={mockLoadOption === 'both' ? 'primary' : 'ghost'}
            onClick={() => setMockLoadOption('both')}
          >
            Both
          </Button>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              setMockLoading(true);
              try {
                const seedSet =
                  mockLoadOption === 'crypto'
                    ? MORE_CRYPTO_MOCK_TRADES
                    : mockLoadOption === 'forex'
                    ? MORE_FOREX_MOCK_TRADES
                    : COMBINED_MOCK_TRADES;

                await loadMockTrades(repoRef.current, seedSet, setPositions);

                // Also seed analyses matched with trades including TradingView links
                await loadExplicitAnalyses(analysisService, repoRef.current, [
                  {
                    symbol: 'BTCUSD',
                    market: 'Crypto',
                    notes: 'BTC seeded analyses with TradingView links',
                    timeframes: [
                      {
                        timeframe: '4h',
                        tradingViewLink: 'https://www.tradingview.com/x/zuXCVxnH/',
                      },
                      {
                        timeframe: '1h',
                        tradingViewLink: 'https://www.tradingview.com/x/zuXCVxnH/',
                      },
                      {
                        timeframe: 'daily',
                        tradingViewLink: 'https://www.tradingview.com/x/zuXCVxnH/',
                      },
                      {
                        timeframe: '2h',
                        tradingViewLink: 'https://www.tradingview.com/x/zuXCVxnH/',
                      },
                      {
                        timeframe: '15min',
                        tradingViewLink: 'https://www.tradingview.com/x/zuXCVxnH/',
                      },
                      {
                        timeframe: 'weekly',
                        tradingViewLink: 'https://www.tradingview.com/x/zuXCVxnH/',
                      },
                      {
                        timeframe: 'monthly',
                        tradingViewLink: 'https://www.tradingview.com/x/zuXCVxnH/',
                      },
                    ],
                  },
                  {
                    symbol: 'USDCAD',
                    market: 'Forex',
                    notes: 'USDCAD seeded analyses with TradingView links',
                    timeframes: [
                      {
                        timeframe: '4h',
                        tradingViewLink: 'https://www.tradingview.com/x/MGlHVCHj/',
                      },
                      {
                        timeframe: '1h',
                        tradingViewLink: 'https://www.tradingview.com/x/MGlHVCHj/',
                      },
                      {
                        timeframe: 'daily',
                        tradingViewLink: 'https://www.tradingview.com/x/MGlHVCHj/',
                      },
                      {
                        timeframe: '2h',
                        tradingViewLink: 'https://www.tradingview.com/x/MGlHVCHj/',
                      },
                      {
                        timeframe: '15min',
                        tradingViewLink: 'https://www.tradingview.com/x/MGlHVCHj/',
                      },
                      {
                        timeframe: 'weekly',
                        tradingViewLink: 'https://www.tradingview.com/x/MGlHVCHj/',
                      },
                      {
                        timeframe: 'monthly',
                        tradingViewLink: 'https://www.tradingview.com/x/MGlHVCHj/',
                      },
                    ],
                  },
                  {
                    symbol: 'ETHUSD',
                    market: 'Crypto',
                    notes: 'ETH 4H seeded from mock loader',
                    timeframes: [
                      {
                        timeframe: '4h',
                        tradingViewLink:
                          'https://www.tradingview.com/chart/?symbol=BINANCE:ETHUSDT',
                      },
                      {
                        timeframe: '1h',
                        tradingViewLink:
                          'https://www.tradingview.com/chart/?symbol=BINANCE:ETHUSDT',
                      },
                      {
                        timeframe: 'daily',
                        tradingViewLink:
                          'https://www.tradingview.com/chart/?symbol=BINANCE:ETHUSDT',
                      },
                      {
                        timeframe: 'weekly',
                        tradingViewLink:
                          'https://www.tradingview.com/chart/?symbol=BINANCE:ETHUSDT',
                      },
                    ],
                  },
                  {
                    symbol: 'EURUSD',
                    market: 'Forex',
                    notes: 'EURUSD seeded from mock loader',
                    timeframes: [
                      {
                        timeframe: '4h',
                        tradingViewLink: 'https://www.tradingview.com/chart/?symbol=FX:EURUSD',
                      },
                      {
                        timeframe: '1h',
                        tradingViewLink: 'https://www.tradingview.com/chart/?symbol=FX:EURUSD',
                      },
                      {
                        timeframe: 'daily',
                        tradingViewLink: 'https://www.tradingview.com/chart/?symbol=FX:EURUSD',
                      },
                      {
                        timeframe: 'weekly',
                        tradingViewLink: 'https://www.tradingview.com/chart/?symbol=FX:EURUSD',
                      },
                    ],
                  },
                  {
                    symbol: 'GBPUSD',
                    market: 'Forex',
                    notes: 'GBPUSD seeded from mock loader',
                    timeframes: [
                      {
                        timeframe: '4h',
                        tradingViewLink: 'https://www.tradingview.com/chart/?symbol=FX:GBPUSD',
                      },
                      {
                        timeframe: '1h',
                        tradingViewLink: 'https://www.tradingview.com/chart/?symbol=FX:GBPUSD',
                      },
                      {
                        timeframe: 'daily',
                        tradingViewLink: 'https://www.tradingview.com/chart/?symbol=FX:GBPUSD',
                      },
                      {
                        timeframe: 'weekly',
                        tradingViewLink: 'https://www.tradingview.com/chart/?symbol=FX:GBPUSD',
                      },
                    ],
                  },
                ]);

                // Refresh trades to reflect linked analysisIds
                if (repoRef.current && typeof repoRef.current.getAll === 'function') {
                  try {
                    const all = await repoRef.current.getAll();
                    const dto = all.map((t) => TradeFactory.toDTO(t)) as unknown as TradeRow[];
                    setPositions(dto);
                  } catch {
                    /* ignore */
                  }
                }
              } finally {
                setMockLoading(false);
                onClose();
              }
            }}
          >
            {mockLoading ? 'Loading…' : 'Load'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MockLoaderModal;
