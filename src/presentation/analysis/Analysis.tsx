import React, { useEffect, useState } from 'react';
import styles from './Analysis.module.css';
import { Card } from '@/presentation/shared/components/Card/Card';
// Editor removed: show list-only UI similar to TradeJournal
import { AnalysisList, AnalysisSummary } from '@/presentation/analysis/AnalysisList';
import { AnalysisDetail } from '@/presentation/analysis/AnalysisDetail';
import { LocalStorageAnalysisRepository } from '@/infrastructure/analysis/repositories/LocalStorageAnalysisRepository';
import type { AnalysisDTO as AnalysisDTOType } from '@/domain/analysis/interfaces/AnalysisRepository';
// Editor types removed

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

  const handleOpen = async (id: string) => {
    setSelected(id);
  };

  return (
    <div
      className={compactView ? `${styles.container} ${styles.compact}` : styles.container}
      data-compact={compactView}
    >
      <h2 className={styles.title}>Marktanalyse</h2>

      {/* Show list of analyses (left) and detail panel (right) — no editor on this screen */}
      <div className={styles.grid}>
        <div style={{ minWidth: 320 }}>
          <Card title="Analysen">
            <AnalysisList items={list} compactView={compactView} selectedId={selected} onSelect={handleOpen} />
          </Card>
        </div>

        <div style={{ flex: 1 }}>
          <React.Suspense fallback={<div>Loading...</div>}>
            {selected ? <DetailLoader id={selected} onCreateTrade={onCreateTradeSuggestion} /> : <div style={{ padding: 16 }}>Keine Analyse ausgewählt</div>}
          </React.Suspense>
        </div>
      </div>
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
