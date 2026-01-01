import React, { useEffect, useState } from 'react';
import styles from './Analysis.module.css';
import { Card } from '@/presentation/shared/components/Card/Card';
import { AnalysisEditor } from '@/presentation/analysis/AnalysisEditor';
import { AnalysisList, AnalysisSummary } from '@/presentation/analysis/AnalysisList';
import { AnalysisDetail } from '@/presentation/analysis/AnalysisDetail';
import { LocalStorageAnalysisRepository } from '@/infrastructure/analysis/repositories/LocalStorageAnalysisRepository';
import { AnalysisService } from '@/application/analysis/services/AnalysisService';
import type { AnalysisDTO as AnalysisDTOType } from '@/domain/analysis/interfaces/AnalysisRepository';
import type { TimeframeInput } from '@/presentation/analysis/AnalysisEditor';

export type AnalysisSuggestion = {
  analysisId?: string;
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

const repository = new LocalStorageAnalysisRepository();
const service = new AnalysisService(repository);

export function Analysis({ onCreateTradeSuggestion, compactView = false }: AnalysisProps) {
  const [list, setList] = useState<AnalysisSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    // load existing analyses from repo (localStorage)
    let mounted = true;
    (async () => {
      const all = await repository.listAll();
      if (!mounted) return;
      setList(
        all.map((a) => ({ id: a.id, symbol: a.symbol, createdAt: a.createdAt, notes: a.notes }))
      );
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // listen for deep-link events (dispatched from trade UI)
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail;
        if (detail && typeof detail.id === 'string') {
          setSelected(detail.id);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('open-analysis', handler as EventListener);
    return () => window.removeEventListener('open-analysis', handler as EventListener);
  }, []);

  const handleSaveAnalysis = async (input: {
    symbol: string;
    notes?: string;
    timeframes?: TimeframeInput[];
  }) => {
    // create an analysis via service and update local list
    const a = await service.createAnalysis({
      symbol: input.symbol,
      notes: input.notes,
      timeframes: input.timeframes,
    });
    setList((prev) => [
      ...prev,
      { id: a.id, symbol: a.symbol, createdAt: a.createdAt, notes: a.notes },
    ]);
    // keep editor focused and don't auto-open the detail view
  };

  const handleOpen = async (id: string) => {
    setSelected(id);
  };

  return (
    <div
      className={compactView ? `${styles.container} ${styles.compact}` : styles.container}
      data-compact={compactView}
    >
      <h2 className={styles.title}>Marktanalyse</h2>

      {/* If no analysis selected: show editor full-width and list below. If selected: show two-column with list/editor on the left and detail on the right. */}
      {selected ? (
        <div className={styles.grid}>
          <div style={{ minWidth: 320 }}>
            <Card title="Analyse erstellen">
              <AnalysisEditor onSave={handleSaveAnalysis} />
            </Card>

            <Card title="Analysen">
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div> </div>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      // provide a simple example suggestion so tests can click this control
                      if (onCreateTradeSuggestion) {
                        onCreateTradeSuggestion({
                          symbol: 'EURUSD',
                          price: 1.12,
                          size: 1000,
                          side: 'LONG',
                          market: 'Forex',
                          entryDate: new Date().toISOString(),
                        });
                      }
                    }}
                    style={{ marginRight: 8, padding: '6px 8px', borderRadius: 6 }}
                  >
                    Create example trade from analysis
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onCreateTradeSuggestion) {
                        onCreateTradeSuggestion({
                          symbol: 'EURUSD',
                          price: 1.12,
                          size: 1000,
                          side: 'LONG',
                          market: 'Forex',
                          entryDate: new Date().toISOString(),
                        });
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.04)',
                      color: 'var(--color-text)',
                      padding: '6px 8px',
                      borderRadius: 6,
                    }}
                  >
                    Create Trade
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        !window.confirm(
                          'Alle Analysen löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
                        )
                      )
                        return;
                      await repository.clear();
                      setList([]);
                      setSelected(null);
                    }}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.04)',
                      color: 'var(--color-text)',
                      padding: '6px 8px',
                      borderRadius: 6,
                      marginLeft: 8,
                    }}
                  >
                    Delete all
                  </button>
                </div>
              </div>
              <AnalysisList items={list} compactView={compactView} onOpen={handleOpen} />
            </Card>
          </div>

          <div style={{ flex: 1 }}>
            <React.Suspense fallback={<div>Loading...</div>}>
              {/* show detail when an analysis is selected */}
              <DetailLoader id={selected} onCreateTrade={onCreateTradeSuggestion} />
            </React.Suspense>
          </div>
        </div>
      ) : (
        <div className={styles.grid} style={{ gridTemplateColumns: '1fr' }}>
          <div>
            <Card title="Analyse erstellen">
              <AnalysisEditor onSave={handleSaveAnalysis} />
            </Card>

            <Card title="Analysen">
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div> </div>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      // provide a simple example suggestion so tests can click this control
                      if (onCreateTradeSuggestion) {
                        onCreateTradeSuggestion({
                          symbol: 'EURUSD',
                          price: 1.12,
                          size: 1000,
                          side: 'LONG',
                          market: 'Forex',
                          entryDate: new Date().toISOString(),
                        });
                      }
                    }}
                    style={{ marginRight: 8, padding: '6px 8px', borderRadius: 6 }}
                  >
                    Create example trade from analysis
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onCreateTradeSuggestion) {
                        onCreateTradeSuggestion({
                          symbol: 'EURUSD',
                          price: 1.12,
                          size: 1000,
                          side: 'LONG',
                          market: 'Forex',
                          entryDate: new Date().toISOString(),
                        });
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.04)',
                      color: 'var(--color-text)',
                      padding: '6px 8px',
                      borderRadius: 6,
                    }}
                  >
                    Create Trade
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        !window.confirm(
                          'Alle Analysen löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
                        )
                      )
                        return;
                      await repository.clear();
                      setList([]);
                      setSelected(null);
                    }}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.04)',
                      color: 'var(--color-text)',
                      padding: '6px 8px',
                      borderRadius: 6,
                      marginLeft: 8,
                    }}
                  >
                    Delete all
                  </button>
                </div>
              </div>
              <AnalysisList items={list} compactView={compactView} onOpen={handleOpen} />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailLoader({
  id,
  onCreateTrade,
}: {
  id: string;
  onCreateTrade?: (s: AnalysisSuggestion) => void | Promise<void>;
}) {
  const [analysis, setAnalysis] = useState<AnalysisDTOType | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const a = await repository.getById(id);
      if (mounted) setAnalysis(a);
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (!analysis) return <div>Lädt Analyse...</div>;

  return (
    <AnalysisDetail
      analysis={analysis}
      compactView={false}
      onCreateTrade={(_analysisId) => {
        void _analysisId;
        if (!onCreateTrade) return;
        // determine market heuristically from symbol: if both first3 and last3 are fiat codes -> Forex, else Crypto
        const fiat = new Set(['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD']);
        const s = (analysis.symbol || '').toUpperCase();
        const first3 = s.substring(0, 3);
        const last3 = s.substring(s.length - 3);
        const marketGuess = fiat.has(first3) && fiat.has(last3) ? 'Forex' : 'Crypto';
        // we create a simple suggestion from analysis and include the originating analysis id so it can be stored on the trade
        onCreateTrade({
          analysisId: analysis.id,
          symbol: analysis.symbol,
          price: 0,
          entryDate: new Date().toISOString(),
          market: marketGuess,
        });
      }}
    />
  );
}

export default Analysis;
