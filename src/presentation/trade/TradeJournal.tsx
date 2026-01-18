/* eslint-disable no-console */
import React, { useEffect, useRef, useState } from 'react';
// Layout is provided by App; do not render Layout again here to avoid duplicate headers
// Intentionally do not use Card here for the trades area — render simple tabs
import { Button } from '@/presentation/shared/components/Button/Button';
import { SideValue } from '@/presentation/shared/components/SideSelect/SideSelect';
import styles from './TradeJournal.module.css';
import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository';
import { ConfirmDialog } from '@/presentation/shared/components/ConfirmDialog/ConfirmDialog';
import { Analysis } from '@/presentation/analysis/Analysis';
import type { MarketValue } from '@/presentation/shared/components/MarketSelect/MarketSelect';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';
import LocalStorageTradeRepository from '@/infrastructure/trade/repositories/LocalStorageTradeRepository';
import type { TradeRow } from './types';
import { useNewTradeForm, type NewTradeFormState } from './hooks/useNewTradeForm';
import { StatusFilters } from './components/TradeFilters/TradeFilters';
import FilterToolbar from '@/presentation/shared/components/FilterToolbar/FilterToolbar';
import CombinedFilterMenu from '@/presentation/shared/components/CombinedFilterMenu/CombinedFilterMenu';
import type { AnalysisInput } from '@/domain/analysis/factories/AnalysisFactory';
import type { AnalysisFormValues } from '@/presentation/analysis/validation';
import type { TimeframeInput } from '@/presentation/analysis/types';
import AddPanel from '@/presentation/shared/components/AddPanel/AddPanel';
import useIsMobile from '@/presentation/shared/hooks/useIsMobile';
import MobileNewTrade from './components/MobileNewTrade/MobileNewTrade';
import { loadSettings } from '@/presentation/settings/settingsStorage';
import MockLoaderModal from './components/MockLoaderModal/MockLoaderModal';
import TradesPanel from './components/TradesPanel/TradesPanel';
import { useTradesViewModel } from './hooks/useTradesViewModel';

// Analysis link helpers
import { FirebaseAnalysisRepository } from '@/infrastructure/analysis/repositories/FirebaseAnalysisRepository';
import HybridAnalysisRepository from '@/infrastructure/analysis/repositories/HybridAnalysisRepository';
import { AnalysisService } from '@/application/analysis/services/AnalysisService';

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

// Use HybridAnalysisRepository to ensure local mirror + event dispatch for UI updates
const analysisRepo = (() => {
  if (useFirebase && process.env.NODE_ENV !== 'test') {
    const remote = new FirebaseAnalysisRepository();
    return new HybridAnalysisRepository({ remote });
  }
  return new HybridAnalysisRepository();
})();
const analysisService = new AnalysisService(analysisRepo);

type TradeJournalProps = { repo?: TradeRepository; forceCompact?: boolean };

export function TradeJournal({ repo, forceCompact }: TradeJournalProps) {
  const isTestEnv = process.env.NODE_ENV === 'test';
  // read user setting to decide whether to show Load mock data control
  const [showLoadMockButton, setShowLoadMockButton] = useState<boolean>(() => {
    try {
      const s = loadSettings();
      return typeof s.showLoadMockButton === 'boolean' ? s.showLoadMockButton : true;
    } catch {
      return true;
    }
  });
  // keep in sync if settings change elsewhere (optional: could add a storage event listener)
  useEffect(() => {
    const handler = () => {
      try {
        const s = loadSettings();
        setShowLoadMockButton(
          typeof s.showLoadMockButton === 'boolean' ? s.showLoadMockButton : true
        );
      } catch {
        /* ignore */
      }
    };
    globalThis.addEventListener('storage', handler as EventListener);
    return () => globalThis.removeEventListener('storage', handler as EventListener);
  }, []);

  // modal state for loading mock data
  const [mockModalOpen, setMockModalOpen] = useState(false);

  // repository instance must be injected via props (composition root). Do not require() here.
  const repoRef = useRef<TradeRepository | null>(repo ?? null);
  // Keep ref in sync if prop changes (composition root may re-create repo)
  useEffect(() => {
    repoRef.current = repo ?? null;
  }, [repo]);
  if (!repoRef.current) {
    // In non-test environments, fall back to a LocalStorageTradeRepository so actions persist
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
      try {
        repoRef.current = new LocalStorageTradeRepository();
        // eslint-disable-next-line no-console
        console.info('[TradeJournal] using LocalStorageTradeRepository fallback');
      } catch {
        // ignore if localStorage unavailable
      }
    } else {
      // In test env keep null to allow test injection/mocking
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development')
        console.warn(
          'No TradeRepository provided to TradeJournal; persistence disabled. Provide repo prop from composition root.'
        );
    }
  }

  // Use view model hook to manage positions and actions
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const {
    positions,
    setPositions,
    performAction,
    performTPHit,
    handleInlineUpdate,
    undoInfo,
    handleUndo,
    updateTradeById,
  } = useTradesViewModel({ repoRef, analysisService, setLastStatus });

  // Prefill state when opening Add Analysis from other parts of the app
  const [initialAnalysis, setInitialAnalysis] = useState<{
    symbol?: string;
    notes?: string;
    market?: 'Forex' | 'Crypto';
  } | null>(null);
  const [pendingLinkTradeId, setPendingLinkTradeId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail;
        if (!detail) return;
        const ia = {
          symbol: detail.symbol as string | undefined,
          notes: detail.notes as string | undefined,
          market: detail.market as 'Forex' | 'Crypto' | undefined,
        };
        setInitialAnalysis(ia);
        if (detail.tradeId) setPendingLinkTradeId(detail.tradeId as string);
        setTradesCardTab('analysis');
      } catch {
        /* ignore */
      }
    };
    globalThis.addEventListener('prefill-analysis', handler as EventListener);
    return () => globalThis.removeEventListener('prefill-analysis', handler as EventListener);
  }, []);

  // market and status filters (missing earlier) — restore here
  const [marketFilter, setMarketFilter] = useState<'All' | 'Crypto' | 'Forex'>('All');
  const [tradeStatusFilter, setTradeStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED' | 'FILLED'>(
    'ALL'
  );

  // selected trade id for left-right layout
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // active tab for the Trades card (list | analysis)
  const [tradesCardTab, setTradesCardTab] = useState<'list' | 'analysis'>('list');
  // Note: ultra-wide layout is now permanent (no toggle)

  const [analysisMarketFilter, setAnalysisMarketFilter] = useState<'All' | 'Crypto' | 'Forex'>(
    'All'
  );
  const [analysisVisibleCount, setAnalysisVisibleCount] = useState(0);
  

  useEffect(() => {
    if (tradesCardTab !== 'analysis') {
      // clear any analysis selection-related UI when leaving analysis tab
    }
  }, [tradesCardTab]);

  // load initial data from repo once on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!repoRef.current) return;
        console.info('[TradeJournal] initial load: repo present, calling getAll()');
        const domainTrades = await repoRef.current.getAll();
        console.info(
          '[TradeJournal] initial load: repo.getAll() returned',
          Array.isArray(domainTrades) ? domainTrades.length : typeof domainTrades,
          Array.isArray(domainTrades) ? domainTrades.slice(0, 5) : domainTrades
        );
        if (!mounted) return;
        // convert domain Trades to presentation primitives
        const all = domainTrades.map((dt) => TradeFactory.toDTO(dt));
        console.info('[TradeJournal] initial load: mapped to DTOs', all.length);
        setPositions(all as unknown as TradeRow[]);
      } catch {
        console.warn('[TradeJournal] initial load: failed to load trades from repo');
        // ignore init errors
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Reload trades when repository signals updates (e.g., remote snapshot mirrored)
  useEffect(() => {
    const handler = async (_e: Event) => {
      void _e;
      try {
        if (!repoRef.current) return;
        const domainTrades = await repoRef.current.getAll();
        const all = domainTrades.map((dt) => TradeFactory.toDTO(dt));
        setPositions(all as unknown as TradeRow[]);
      } catch {
        /* ignore */
      }
    };
    globalThis.addEventListener('trades-updated', handler as EventListener);
    return () => globalThis.removeEventListener('trades-updated', handler as EventListener);
  }, []);

  // Mobile modal state for New Trade (used on small screens)
  const [newTradeModalOpen, setNewTradeModalOpen] = useState(false);
  const isMobile = useIsMobile(480);

  // containerRef + compactGrid for responsive layout (moved from large file)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [compactGrid, setCompactGrid] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (typeof forceCompact === 'boolean') {
      setCompactGrid(forceCompact);
      return;
    }

    const tableMin = 900;
    const gap = 18;
    const extraBuffer = 220;

    const compute = () => {
      const style = getComputedStyle(el);
      const paddingLeft = parseInt(style.paddingLeft || '0', 10);
      const paddingRight = parseInt(style.paddingRight || '0', 10);
      const available = el.clientWidth - paddingLeft - paddingRight;

      const vw22 = Math.round((el.clientWidth * 22) / 100);
      const leftPreferred = Math.min(Math.max(280, vw22), 420);

      const required = leftPreferred + tableMin + gap + extraBuffer;
      setCompactGrid(available < required);
    };

    const ro = new ResizeObserver(compute);
    ro.observe(el);
    compute();
    return () => ro.disconnect();
  }, [forceCompact]);

  // Trades nach Markt filtern (berechnet aus editierbaren Positionen)
  const trades = (() => {
    let filtered = positions;
    if (marketFilter !== 'All') filtered = filtered.filter((t) => t.market === marketFilter);
    if (tradeStatusFilter === 'OPEN') filtered = filtered.filter((t) => t.status === 'OPEN');
    if (tradeStatusFilter === 'CLOSED') filtered = filtered.filter((t) => t.status === 'CLOSED');
    if (tradeStatusFilter === 'FILLED') filtered = filtered.filter((t) => t.status === 'FILLED');
    return filtered;
  })();

  // Map trades once to the presentation shape used by TradeList — avoids duplicated mapping code
  const tradeListItems: TradeRow[] = trades;

  // use extracted form hook to keep component slimmer
  const {
    form,
    setForm,
    touched,
    setTouched,
    formSubmitted,
    // setFormSubmitted intentionally unused here; handled inside useNewTradeForm
    formKey,
    handleAdd,
    resetNewTradeForm,
    formErrors,
  } = useNewTradeForm({
    repoRef,
    setPositions,
    analysisService,
    newTradeModalOpen,
    setNewTradeModalOpen,
    setLastStatus,
  });

  // Unified submit handler to avoid duplicating the same logic in multiple JSX locations
  const submitNewTrade = React.useCallback(
    async (e?: React.FormEvent) => {
      // avoid duplicating setFormSubmitted — handleAdd already sets it inside the hook
      setTouched((prev: Record<string, boolean>) => ({ ...prev, price: true }));
      try {
        await handleAdd(e);
      } catch (err) {
        // handleAdd manages internal errors; surface minimal logging here
        console.warn('handleAdd failed', err);
      }
    },
    [handleAdd, setTouched]
  );

  // Confirmation dialog state for SL/close actions
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTradeId, setConfirmTradeId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    'close' | 'sl-be' | 'sl-hit' | 'toggle-side' | 'delete' | null
  >(null);

  const handleConfirm = () => {
    if (!confirmAction || !confirmTradeId) return;
    performAction(confirmAction, confirmTradeId);
    setConfirmOpen(false);
    setConfirmAction(null);
    setConfirmTradeId(null);
  };

  const handleCancelConfirm = () => {
    setConfirmOpen(false);
    setConfirmAction(null);
    setConfirmTradeId(null);
  };

  // helper: ISO string -> datetime-local format used by input[type=datetime-local]
  const toDatetimeLocal = (iso?: string) => {
    const d = iso ? new Date(iso) : new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  // PREFILL the New Trade form from an analysis suggestion (no auto-persist)
  const handleCreateTradeFromAnalysis = async (
    s: import('@/presentation/analysis/Analysis').AnalysisSuggestion
  ) => {
    const entryDateLocal = toDatetimeLocal(s.entryDate);
    setForm({
      symbol: s.symbol,
      entryDate: entryDateLocal,
      size: s.size ?? undefined,
      price: s.price ?? undefined,
      side: (s.side ?? 'LONG') as SideValue,
      market: (s.market ?? '') as MarketValue,
      notes: `Suggested from analysis (${s.market ?? 'unspecified'})`,
      status: 'OPEN',
      analysisId: s.analysisId ?? undefined,
    });
    // switch to list view so the user can review the New Trade form in the left column
    setTradesCardTab('list');
    setMarketFilter(s.market ?? 'All');
    setSelectedId(null);
  };

  

  // Listen for open-trade events from Analysis view to select the trade linked to an analysis
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail;
        if (detail && typeof detail.analysisId === 'string') {
          const aid = detail.analysisId as string;
          // try to find a trade with this analysisId
          const found = positions.find((p) => p.analysisId === aid);
          if (found) {
            // switch to trades list and select the trade
            setTradesCardTab('list');
            setMarketFilter(found.market ?? 'All');
            setSelectedId(found.id);
            // open editor on small screens
          } else {
            // If not found yet, poll a few times in case positions load shortly
            let attempts = 0;
            const maxAttempts = 5;
            const tryFind = () => {
              attempts += 1;
              const f = positions.find((p) => p.analysisId === aid);
              if (f) {
                setTradesCardTab('list');
                setMarketFilter(f.market ?? 'All');
                setSelectedId(f.id);
              } else if (attempts < maxAttempts) {
                setTimeout(tryFind, 150);
              }
            };
            tryFind();
          }
        }
      } catch {
        /* ignore */
      }
    };
    globalThis.addEventListener('open-trade', handler as EventListener);
    return () => globalThis.removeEventListener('open-trade', handler as EventListener);
  }, [positions, isMobile]);

  // small visible status panel (debug) — can be removed later
  const repoEnabled = Boolean(repoRef.current);
  // read user setting and env default for debug UI
  const settings = typeof globalThis !== 'undefined' ? loadSettings() : {};
  const debugUiEnabled =
    typeof settings.debugUI === 'boolean'
      ? settings.debugUI
      : typeof process !== 'undefined' &&
        (process.env.REACT_APP_DEBUG_UI === 'true' || process.env.NODE_ENV === 'development');

  // provide a request-based delete handler for the editor that shows a confirmation dialog.
  // the actual deletion is performed by `performAction('delete', id)` when the user confirms.
  const requestDelete = (id: string): Promise<void> => {
    setConfirmTradeId(id);
    setConfirmAction('delete');
    setConfirmOpen(true);
    return Promise.resolve();
  };

  return (
    <>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Trading Journal</h2>
        <div className={styles.controls}>
          {showLoadMockButton && (
            <Button variant="secondary" onClick={() => setMockModalOpen(true)}>
              Load mock data
            </Button>
          )}
        </div>
      </div>

      {/* Mobile-only New Trade button: opens modal instead of showing inline form */}
      <MobileNewTrade
        isMobile={isMobile}
        newTradeModalOpen={newTradeModalOpen}
        setNewTradeModalOpen={setNewTradeModalOpen}
        form={form}
        formErrors={formErrors}
        touched={touched}
        formSubmitted={formSubmitted}
        formKey={formKey}
        debugUiEnabled={debugUiEnabled}
        lastStatus={lastStatus}
        onChangeForm={(patch: Partial<NewTradeFormState>) =>
          setForm((prev: NewTradeFormState) => ({ ...prev, ...patch }))
        }
        onBlurField={(f: string) =>
          setTouched((prev: Record<string, boolean>) => ({ ...prev, [f]: true }))
        }
        onSubmit={submitNewTrade}
        onReset={resetNewTradeForm}
        setMarketFilter={(m: string) =>
          setMarketFilter(m === '' ? 'All' : (m as 'All' | 'Crypto' | 'Forex'))
        }
        handleAdd={handleAdd}
      />

      {/* containerRef wraps the grid so we can detect available width */}
      <div
        ref={containerRef}
        className={
          `${compactGrid ? `${styles.grid} ${styles.gridCompact}` : `${styles.grid}`} ${
            styles.fullScreen
          } ${tradesCardTab === 'analysis' ? styles.analysisActive : ''}`.trim()
        }
      >
        <div className={styles.left}>
          <AddPanel
            mode={tradesCardTab === 'analysis' ? 'analysis' : 'trade'}
            isMobile={isMobile}
            form={form}
            formErrors={formErrors}
            touched={touched}
            formSubmitted={formSubmitted}
            formKey={formKey}
            debugUiEnabled={debugUiEnabled}
            lastStatus={lastStatus}
            onChangeForm={(patch: Partial<NewTradeFormState>) =>
              setForm((prev: NewTradeFormState) => ({ ...prev, ...patch }))
            }
            onBlurField={(f: string) =>
              setTouched((prev: Record<string, boolean>) => ({ ...prev, [f]: true }))
            }
            onSubmit={submitNewTrade}
            onReset={resetNewTradeForm}
            setMarketFilter={(m: string) =>
              setMarketFilter(m === '' ? 'All' : (m as 'All' | 'Crypto' | 'Forex'))
            }
            initialAnalysis={initialAnalysis ?? undefined}
            onSaveAnalysis={async (
              input: AnalysisFormValues & { timeframes?: TimeframeInput[] }
            ) => {
              try {
                const payload: AnalysisInput = {
                  symbol: input.symbol,
                  notes: input.notes,
                  market: input.market ?? undefined,
                  timeframes: Array.isArray(input.timeframes)
                    ? input.timeframes.map((tf) => ({
                        timeframe: tf.timeframe,
                        tradingViewLink: tf.tradingViewLink,
                        note: tf.note,
                      }))
                    : input.timeframes,
                };
                const created = await analysisService.createAnalysis(payload);
                // if this creation was initiated from a trade detail, link it
                if (pendingLinkTradeId && updateTradeById) {
                  try {
                    updateTradeById(pendingLinkTradeId, { analysisId: created.id });
                  } catch {
                    /* ignore linking errors */
                  }
                  setPendingLinkTradeId(null);
                  setInitialAnalysis(null);
                }
                // switch to analysis tab to show created analysis
                setTradesCardTab('analysis');
              } catch (err) {
                console.warn('Failed to save analysis', err);
              }
            }}
          />
        </div>

        <div className={styles.right}>
          <div className={`${styles.cardFullBleedTrade} ${styles.tradesArea}`.trim()}>
            <div className={styles.tradesHeader}>
                <div className={styles.tradesHeaderColumn}>
                <div className={styles.tradesTitle}>{tradesCardTab === 'analysis' ? 'Analysen' : 'Trades'}</div>
                {/* StatusFilters are rendered inside the unified FilterToolbar below to avoid duplication */}
              </div>
              <div className={styles.tradesControls}>
                <div className={styles.tradesTabs} role="tablist" aria-label="Trades tabs">
                  <Button
                    type="button"
                    role="tab"
                    aria-selected={tradesCardTab === 'list'}
                    variant={tradesCardTab === 'list' ? 'primary' : 'ghost'}
                    className={tradesCardTab === 'list' ? styles.tradesTabActive : styles.tradesTab}
                    onClick={() => setTradesCardTab('list')}
                  >
                    List
                  </Button>
                  <Button
                    type="button"
                    role="tab"
                    aria-selected={tradesCardTab === 'analysis'}
                    variant={tradesCardTab === 'analysis' ? 'primary' : 'ghost'}
                    className={tradesCardTab === 'analysis' ? styles.tradesTabActive : styles.tradesTab}
                    onClick={() => setTradesCardTab('analysis')}
                  >
                    Analyse
                  </Button>
                </div>
                {/* Render unified FilterToolbar to keep layout consistent with Analysis */}
                <div className={styles.marketFiltersWrap}>
                  {/* keep tabs separate; FilterToolbar only renders the filter controls */}
                  {/* StatusFilters are shown only in list view here */}
                  <FilterToolbar
                    marketFilter={tradesCardTab === 'analysis' ? analysisMarketFilter : marketFilter}
                    setMarketFilter={(m) =>
                      tradesCardTab === 'analysis' ? setAnalysisMarketFilter(m) : setMarketFilter(m)
                    }
                    showStatusFilters={true}
                    statusFilters={
                      isTestEnv ? (
                        tradesCardTab === 'list' ? (
                          <StatusFilters
                            tradeStatusFilter={tradeStatusFilter}
                            setTradeStatusFilter={(s) => setTradeStatusFilter(s)}
                          />
                        ) : undefined
                      ) : (
                        <CombinedFilterMenu
                          marketFilter={tradesCardTab === 'analysis' ? analysisMarketFilter : marketFilter}
                          setMarketFilter={(m) =>
                            tradesCardTab === 'analysis' ? setAnalysisMarketFilter(m) : setMarketFilter(m)
                          }
                          tradeStatusFilter={tradeStatusFilter}
                          setTradeStatusFilter={(s) => setTradeStatusFilter(s)}
                        />
                      )
                    }
                    hideMarketFilters={!isTestEnv}
                    count={tradesCardTab === 'analysis' ? analysisVisibleCount : trades.length}
                    countLabel={tradesCardTab === 'analysis' ? 'analyses' : 'trades'}
                    
                  />
                </div>
              </div>
            </div>

            <div
              className={[
                styles.listAndDetailWrap,
                tradesCardTab === 'list' ? styles.listOnly : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {tradesCardTab === 'list' ? (
                <TradesPanel
                  tradeListItems={tradeListItems}
                  selectedId={selectedId}
                  onSelect={(id) => {
                    setSelectedId(id);
                  }}
                  performAction={performAction}
                  performTPHit={performTPHit}
                  compactGrid={compactGrid}
                  onInlineUpdate={handleInlineUpdate}
                  onRequestDelete={requestDelete}
                />
              ) : (
                <Analysis
                  onCreateTradeSuggestion={handleCreateTradeFromAnalysis}
                  marketFilter={analysisMarketFilter}
                  onMarketFilterChange={(value) => setAnalysisMarketFilter(value)}
                  showFilterToolbar={false}
                  useCard={false}
                  onVisibleCountChange={setAnalysisVisibleCount}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
        title="Bestätigung erforderlich"
        message={`Sind Sie sicher, dass Sie diese Aktion durchführen möchten?`}
        confirmLabel="Ja"
        cancelLabel="Abbrechen"
        confirmVariant={confirmAction === 'delete' ? 'danger' : 'primary'}
      />

      {/* Mock data loader modal */}
      <MockLoaderModal
        open={mockModalOpen}
        onClose={() => setMockModalOpen(false)}
        repoRef={repoRef}
        setPositions={setPositions}
        analysisService={analysisService}
      />

      {undoInfo && (
        <div className={styles.undoBanner}>
          <div className={styles.undoContent}>
            <div>Aktion durchgeführt — Rückgängig möglich</div>
            <Button variant="ghost" onClick={handleUndo}>
              Undo
            </Button>
          </div>
        </div>
      )}

      {/* Debug/status banner (dev-only) */}
      {repoEnabled && debugUiEnabled && (
        <div className={styles.statusBanner}>
          <div>{positions.length} trades loaded</div>
          {lastStatus && <div className={styles.statusMessage}>{lastStatus}</div>}
        </div>
      )}
      {/* Mobile new-trade UI moved to MobileNewTrade component */}
    </>
  );
}
