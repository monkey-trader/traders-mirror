import React, { useEffect, useState } from 'react';
import styles from './Analysis.module.css';
import { Card } from '@/presentation/shared/components/Card/Card';
// Editor removed: show list-only UI similar to TradeJournal
import { AnalysisList, AnalysisSummary } from '@/presentation/analysis/AnalysisList';
import { MarketFilters } from '@/presentation/trade/components/TradeFilters/TradeFilters';
import { AnalysisDetail } from '@/presentation/analysis/AnalysisDetail';
import { ConfirmDialog } from '@/presentation/shared/components/ConfirmDialog/ConfirmDialog';
import { FirebaseAnalysisRepository } from '@/infrastructure/analysis/repositories/FirebaseAnalysisRepository';
import HybridAnalysisRepository from '@/infrastructure/analysis/repositories/HybridAnalysisRepository';
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

const useFirebase = (() => {
  const viteFlag = (import.meta as unknown as { env?: Record<string, unknown> }).env?.[
    'VITE_USE_FIREBASE'
  ];
  const craFlag = (process.env as Record<string, string | undefined>).REACT_APP_USE_FIREBASE;
  const raw = (viteFlag as string | boolean | undefined) ?? craFlag;
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'string') return raw.toLowerCase() === 'true';
  return false;
})();

const userPrefUseCloud = (() => {
  try {
    const raw = localStorage.getItem('mt_user_settings_v1');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { useCloudSync?: boolean };
    return typeof parsed.useCloudSync === 'boolean' ? parsed.useCloudSync : undefined;
  } catch {
    return undefined;
  }
})();
const effectiveUseFirebase = useFirebase && userPrefUseCloud !== false;

const repository = (() => {
  if (effectiveUseFirebase && process.env.NODE_ENV !== 'test') {
    const remote = new FirebaseAnalysisRepository();
    return new HybridAnalysisRepository({ remote });
  }
  return new HybridAnalysisRepository();
})();

export function Analysis({ onCreateTradeSuggestion, compactView = false }: AnalysisProps) {
  const [list, setList] = useState<AnalysisSummary[]>([]);
  const [marketFilter, setMarketFilter] = useState<'All' | 'Crypto' | 'Forex'>('All');
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedFieldToFocus, setSelectedFieldToFocus] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    // load existing analyses from repo (localStorage) and poll periodically
    let mounted = true;

    const toMarketString = (m: unknown) => {
      if (!m) return '';
      if (typeof m === 'string') return m;
      try {
        const maybe = m as { value?: unknown };
        if (typeof maybe.value === 'string') return maybe.value;
      } catch {
        /* ignore */
      }
      return '';
    };

    const fetchList = async () => {
      try {
        const all = await repository.listAll();
        if (!mounted) return;
        setList(
          all.map((a) => {
            const raw = String(toMarketString(a.market) ?? '');
            const normalized = raw.trim().toLowerCase();
            const marketValue =
              normalized === 'forex' ? 'Forex' : normalized === 'crypto' ? 'Crypto' : 'All';
            return {
              id: a.id,
              symbol: a.symbol,
              createdAt: a.createdAt,
              notes: a.notes,
              market: marketValue,
            };
          })
        );
      } catch {
        /* ignore */
      }
    };

    void fetchList();
    // poll every 15s
    const timer = window.setInterval(() => void fetchList(), 15000);

    return () => {
      mounted = false;
      clearInterval(timer as unknown as number);
    };
  }, []);

  useEffect(() => {
    // reload list when analyses change elsewhere in the app
    const handler = async (_e: Event) => {
      void _e;
      try {
        // ignore event details; simply reload full list to keep in sync
        const all = await repository.listAll();
        const toMarketString = (m: unknown) => {
          if (!m) return '';
          if (typeof m === 'string') return m;
          try {
            const maybe = m as { value?: unknown };
            if (typeof maybe.value === 'string') return maybe.value;
          } catch {
            /* ignore */
          }
          return '';
        };

        setList(
          all.map((a) => {
            const raw = String(toMarketString(a.market) ?? '');
            const normalized = raw.trim().toLowerCase();
            const marketValue =
              normalized === 'forex' ? 'Forex' : normalized === 'crypto' ? 'Crypto' : 'All';
            return {
              id: a.id,
              symbol: a.symbol,
              createdAt: a.createdAt,
              notes: a.notes,
              market: marketValue,
            };
          })
        );
      } catch {
        /* ignore */
      }
    };
    globalThis.addEventListener('analyses-updated', handler as EventListener);
    return () => globalThis.removeEventListener('analyses-updated', handler as EventListener);
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
    globalThis.addEventListener('open-analysis', handler as EventListener);
    return () => globalThis.removeEventListener('open-analysis', handler as EventListener);
  }, []);

  const handleOpen = async (id: string, focusField?: string) => {
    setSelected(id);
    if (focusField) {
      setSelectedFieldToFocus(focusField);
      // clear after short delay so it's a one-off trigger
      setTimeout(() => setSelectedFieldToFocus(null), 200);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await repository.delete(id);
      const all = await repository.listAll();
      const toMarketString = (m: unknown) => {
        if (!m) return '';
        if (typeof m === 'string') return m;
        try {
          const maybe = m as { value?: unknown };
          if (typeof maybe.value === 'string') return maybe.value;
        } catch {
          /* ignore */
        }
        return '';
      };

      setList(
        all.map((a) => {
          const raw = String(toMarketString(a.market) ?? '');
          const normalized = raw.trim().toLowerCase();
          const marketValue =
            normalized === 'forex' ? 'Forex' : normalized === 'crypto' ? 'Crypto' : 'All';
          return {
            id: a.id,
            symbol: a.symbol,
            createdAt: a.createdAt,
            notes: a.notes,
            market: marketValue,
          };
        })
      );
      if (selected === id) setSelected(null);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Failed to delete analysis', err);
    }
  };

  const requestDeleteFromDetail = (id: string) => {
    setConfirmId(id);
    setConfirmOpen(true);
  };

  return (
    <div
      className={compactView ? `${styles.container} ${styles.compact}` : styles.container}
      data-compact={compactView}
    >
      <h2 className={styles.title}>Marktanalyse</h2>

      {/* Show list of analyses (left) and detail panel (right) — no editor on this screen */}
      <div className={styles.grid}>
        <div className={styles.leftColumn}>
          <Card title="Analysen">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <MarketFilters
                  marketFilter={marketFilter}
                  setMarketFilter={setMarketFilter}
                  tradesCount={list.length}
                />
                <div />
              </div>
            </div>
            <AnalysisList
              items={marketFilter === 'All' ? list : list.filter((l) => l.market === marketFilter)}
              compactView={compactView}
              selectedId={selected}
              onSelect={handleOpen}
            />
          </Card>
        </div>

        <div className={styles.rightColumn}>
          <React.Suspense fallback={<div>Loading...</div>}>
            {selected ? (
              <>
                <DetailLoader
                  id={selected}
                  startEditingField={selectedFieldToFocus ?? undefined}
                  onCreateTrade={onCreateTradeSuggestion}
                  onRequestDelete={requestDeleteFromDetail}
                />
                <ConfirmDialog
                  open={confirmOpen}
                  title="Delete analysis"
                  message="Are you sure you want to delete this analysis? This cannot be undone."
                  confirmLabel="Delete"
                  cancelLabel="Cancel"
                  confirmVariant="danger"
                  onCancel={() => setConfirmOpen(false)}
                  onConfirm={async () => {
                    setConfirmOpen(false);
                    if (confirmId) await handleDelete(confirmId);
                    setConfirmId(null);
                  }}
                />
              </>
            ) : (
              <div className={styles.noSelection}>Keine Analyse ausgewählt</div>
            )}
          </React.Suspense>
        </div>
      </div>
    </div>
  );
}

function DetailLoader({
  id,
  onCreateTrade,
  onRequestDelete,
  startEditingField,
}: {
  id: string;
  startEditingField?: string | null;
  onCreateTrade?: (s: AnalysisSuggestion) => void | Promise<void>;
  onRequestDelete?: (id: string) => void;
}) {
  const [analysis, setAnalysis] = useState<AnalysisDTOType | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchDetail = async () => {
      try {
        const a = await repository.getById(id);
        if (mounted) setAnalysis(a);
      } catch {
        /* ignore */
      }
    };

    void fetchDetail();
    // poll detail every 15s while open
    const timer = window.setInterval(() => void fetchDetail(), 15000);

    return () => {
      mounted = false;
      clearInterval(timer as unknown as number);
    };
  }, [id]);

  if (!analysis) return <div>Lädt Analyse...</div>;

  return (
    <AnalysisDetail
      analysis={analysis}
      compactView={false}
      // instruct detail/editor to start in edit mode and focus a field if requested
      startEditingField={startEditingField ?? undefined}
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
      onRequestDelete={onRequestDelete}
      onSave={async (updated) => {
              try {
                await repository.save(updated as unknown as AnalysisDTOType);
          // refresh local copy from repo to reflect any normalization
          const refreshed = await repository.getById(updated.id);
          if (refreshed) {
            // update local detail immediately
            try {
              setAnalysis(refreshed);
            } catch {
              /* ignore */
            }
            // dispatch global update so list reloads
            try {
              globalThis.dispatchEvent(new CustomEvent('analyses-updated', { detail: { type: 'local' } }));
            } catch {
              /* ignore */
            }
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('Failed to save analysis', err);
        }
      }}
    />
  );
}

export default Analysis;
