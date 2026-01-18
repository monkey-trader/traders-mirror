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
import { Button } from '@/presentation/shared/components/Button/Button';
import {
  ActionDropdown,
  type ActionDropdownOption,
} from '@/presentation/shared/components/ActionDropdown/ActionDropdown';
import { IconButton } from '@/presentation/shared/components/IconButton/IconButton';
import repoSyncStyles from '@/presentation/shared/components/RepoSyncStatus/RepoSyncStatus.module.css';
// Editor types removed

const ANALYSIS_HASH_PREFIX = '#/analysis';

const buildAnalysisHash = (id: string) => `${ANALYSIS_HASH_PREFIX}?id=${encodeURIComponent(id)}`;

const extractAnalysisIdFromHash = (hash: string): string | null => {
  if (!hash.startsWith(ANALYSIS_HASH_PREFIX)) return null;
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) return null;
  try {
    const params = new URLSearchParams(hash.substring(queryIndex + 1));
    const id = params.get('id');
    return id && id.length > 0 ? id : null;
  } catch {
    return null;
  }
};

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
  marketFilter?: 'All' | 'Crypto' | 'Forex';
  onMarketFilterChange?: (value: 'All' | 'Crypto' | 'Forex') => void;
  showFilterToolbar?: boolean;
  onVisibleCountChange?: (count: number) => void;
  onSelectionChange?: (summary?: AnalysisSummary) => void;
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

export function Analysis({
  onCreateTradeSuggestion,
  compactView = false,
  marketFilter: externalMarketFilter,
  onMarketFilterChange,
  showFilterToolbar = true,
  onVisibleCountChange,
  onSelectionChange,
}: AnalysisProps) {
  const [list, setList] = useState<AnalysisSummary[]>([]);
  const [internalMarketFilter, setInternalMarketFilter] = useState<'All' | 'Crypto' | 'Forex'>(
    externalMarketFilter ?? 'All'
  );
  const marketFilter = externalMarketFilter ?? internalMarketFilter;
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedFieldToFocus, setSelectedFieldToFocus] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pendingDeletes, setPendingDeletes] = useState<string[]>([]);

  useEffect(() => {
    if (externalMarketFilter !== undefined) {
      setInternalMarketFilter(externalMarketFilter);
    }
  }, [externalMarketFilter]);

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

    // load any persistent pending-deletes so we can show spinners after refresh
    try {
      const raw = localStorage.getItem('analysis_pending_deletes_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setPendingDeletes(parsed.filter((x) => typeof x === 'string'));
      }
    } catch {
      /* ignore */
    }

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

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const applyFromHash = () => {
      const hash = window.location.hash ?? '';
      if (!hash.startsWith(ANALYSIS_HASH_PREFIX)) return;
      const idFromHash = extractAnalysisIdFromHash(hash);
      setSelected(idFromHash ?? null);
    };
    applyFromHash();
    const onHashChange = () => applyFromHash();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const filteredList = React.useMemo(() => {
    if (marketFilter === 'All') return list;
    return list.filter((l) => l.market === marketFilter);
  }, [list, marketFilter]);
  const visibleCount = filteredList.length;
  const selectedSummary = React.useMemo(() => {
    if (!selected) return undefined;
    return filteredList.find((item) => item.id === selected);
  }, [filteredList, selected]);

  useEffect(() => {
    if (onSelectionChange) onSelectionChange(selectedSummary);
  }, [onSelectionChange, selectedSummary]);

  useEffect(() => {
    if (onVisibleCountChange) onVisibleCountChange(visibleCount);
  }, [visibleCount, onVisibleCountChange]);

  const handleOpen = async (id: string, focusField?: string) => {
    setSelected(id);
    if (focusField) {
      setSelectedFieldToFocus(focusField);
      // clear after short delay so it's a one-off trigger
      setTimeout(() => setSelectedFieldToFocus(null), 200);
    }
  };

  const handleNavigateToDetail = (id: string) => {
    handleOpen(id);
    if (typeof window === 'undefined') return;
    try {
      const targetHash = buildAnalysisHash(id);
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      } else if (!window.location.hash.startsWith(ANALYSIS_HASH_PREFIX)) {
        window.location.hash = targetHash;
      }
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // mark pending immediately so UI shows spinner
      setPendingDeletes((p) => (p.includes(id) ? p : [...p, id]));
      await repository.delete(id);
      // request immediate outbox flush from hybrid repo (no-op if remote not configured)
      try {
        globalThis.dispatchEvent(new CustomEvent('repo-sync-force'));
      } catch {
        /* ignore */
      }
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
    finally {
      // remove pending state regardless of success/failure
      setPendingDeletes((p) => p.filter((x) => x !== id));
    }
  };

  const requestDelete = (id: string) => {
    setConfirmId(id);
    setConfirmOpen(true);
  };

  const handleMarketFilterChange = (value: 'All' | 'Crypto' | 'Forex') => {
    if (onMarketFilterChange) onMarketFilterChange(value);
    if (externalMarketFilter === undefined) setInternalMarketFilter(value);
  };

  const shouldShowToolbar = showFilterToolbar !== false;
  const filterDescription = marketFilter === 'All' ? 'Alle Märkte' : marketFilter;

  const handleCreateTradeFromSummary = (summary?: AnalysisSummary) => {
    if (!onCreateTradeSuggestion) return;
    const source = summary ?? selectedSummary;
    if (!source) return;
    onCreateTradeSuggestion({
      analysisId: source.id,
      symbol: source.symbol,
      price: 0,
      entryDate: new Date().toISOString(),
      market: source.market,
      side: 'LONG',
    });
  };

  const getActionOptions = (summary: AnalysisSummary): ActionDropdownOption[] => {
    const options: ActionDropdownOption[] = [
      {
        value: 'open',
        label: 'Detail öffnen',
        onSelect: () => handleNavigateToDetail(summary.id),
      },
    ];
    if (onCreateTradeSuggestion) {
      options.push({
        value: 'create-trade',
        label: 'Trade anlegen',
        variant: 'success',
        onSelect: () => handleCreateTradeFromSummary(summary),
      });
    }
    return options;
  };

  return (
    <div
      className={compactView ? `${styles.container} ${styles.compact}` : styles.container}
      data-compact={compactView}
    >
      {shouldShowToolbar ? (
        <div className={styles.headerBlock} data-testid="analysis-toolbar">
          <div className={styles.headerRow}>
            <div className={styles.headerText}>
              <div className={styles.headerLabelRow}>
                <h2 className={styles.title}>Marktanalyse</h2>
                <span className={styles.countBadge}>{visibleCount} analyses</span>
              </div>
              <p className={styles.headerMeta}>Gefiltert: {filterDescription}</p>
            </div>
            {onCreateTradeSuggestion ? (
              <Button
                type="button"
                variant="secondary"
                className={styles.createBtn}
                disabled={!selectedSummary}
                onClick={() => handleCreateTradeFromSummary()}
              >
                Trade anlegen
              </Button>
            ) : null}
          </div>
          <div className={styles.filtersRow}>
            <MarketFilters
              marketFilter={marketFilter}
              setMarketFilter={handleMarketFilterChange}
              tradesCount={visibleCount}
              countLabel="analyses"
            />
          </div>
        </div>
      ) : null}

      <div className={styles.listOnlyLayout}>
        <Card className={styles.listCard} title={shouldShowToolbar ? undefined : 'Analysen'}>
          <AnalysisList
            items={filteredList}
            compactView={compactView}
            selectedId={selected}
            onSelect={handleOpen}
            renderActions={(summary) => {
              // compute whether a delete op for this id is currently queued in outbox
              let outboxHasDelete = false;
              try {
                const rawOut = localStorage.getItem('analysis_outbox_v1');
                if (rawOut) {
                  const parsed = JSON.parse(rawOut);
                  if (Array.isArray(parsed)) {
                    for (const it of parsed) {
                      if (it && it.op === 'delete' && it.id === summary.id) {
                        outboxHasDelete = true;
                        break;
                      }
                    }
                  }
                }
              } catch {
                /* ignore */
              }

              return (
                <div className={styles.actionDropdownWrap}>
                  <div className={styles.deleteWrap}>
                    <IconButton
                      ariaLabel={`Delete ${summary.symbol}`}
                      title="Delete analysis"
                      variant="ghost"
                      className={styles.deleteBtn}
                      onClick={(event) => {
                        event.stopPropagation();
                        requestDelete(summary.id);
                      }}
                      onKeyDown={(event) => {
                        event.stopPropagation();
                      }}
                      icon={
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                          <path
                            d="M6 6 18 18M18 6 6 18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.9"
                            strokeLinecap="round"
                          />
                        </svg>
                      }
                    />
                    {pendingDeletes.includes(summary.id) ? (
                      outboxHasDelete ? (
                        <div className={`${repoSyncStyles.chipQueued} ${styles.deleteStatus}`} aria-hidden>
                          Wartet
                        </div>
                      ) : (
                        <span className={`${repoSyncStyles.spinner} ${styles.deleteSpinner}`} aria-hidden />
                      )
                    ) : null}
                  </div>
                  <div className={styles.dropdownWrap} onClick={(event) => event.stopPropagation()}>
                    <ActionDropdown
                      ariaLabel={`Aktionen für ${summary.symbol}`}
                      placeholder="Aktion"
                      size={compactView ? 'compact' : 'default'}
                      options={getActionOptions(summary)}
                    />
                  </div>
                </div>
              );
            }}
            renderExpandedContent={(summary) => {
              if (selected !== summary.id) return null;
              return (
                <div className={styles.inlineDetail}>
                  <React.Suspense fallback={<div className={styles.detailLoading}>Loading...</div>}>
                    <DetailLoader
                      id={summary.id}
                      startEditingField={selectedFieldToFocus ?? undefined}
                      onCreateTrade={handleCreateTradeFromSummary}
                      onRequestDelete={requestDelete}
                    />
                  </React.Suspense>
                </div>
              );
            }}
          />
        </Card>
      </div>

      {!selected ? <div className={styles.noSelection}>Keine Analyse ausgewählt</div> : null}

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
    </div>
  );
}

function DetailLoader({
  id,
  startEditingField,
  onCreateTrade,
  onRequestDelete,
}: {
  id: string;
  startEditingField?: string | null;
  onCreateTrade?: (summary?: AnalysisSuggestion) => void;
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
      onCreateTrade={onCreateTrade}
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
