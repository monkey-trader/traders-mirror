/* eslint-disable no-console */
import React, { useEffect, useRef, useState } from 'react';
// Layout is provided by App; do not render Layout again here to avoid duplicate headers
import { Card } from '@/presentation/shared/components/Card/Card';
import { Button } from '@/presentation/shared/components/Button/Button';
import { SideValue } from '@/presentation/shared/components/SideSelect/SideSelect';
import styles from './TradeJournal.module.css';
import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository';
import { ConfirmDialog } from '@/presentation/shared/components/ConfirmDialog/ConfirmDialog';
import { Analysis } from '@/presentation/analysis/Analysis';
import type { MarketValue } from '@/presentation/shared/components/MarketSelect/MarketSelect';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';
import type { TradeRow } from './types';
import { useNewTradeForm, type NewTradeFormState } from './hooks/useNewTradeForm';
import { MarketFilters, StatusFilters } from './components/TradeFilters/TradeFilters';
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
import { LocalStorageAnalysisRepository } from '@/infrastructure/analysis/repositories/LocalStorageAnalysisRepository';
import { AnalysisService } from '@/application/analysis/services/AnalysisService';

const analysisRepo = new LocalStorageAnalysisRepository();
const analysisService = new AnalysisService(analysisRepo);

type TradeJournalProps = { repo?: TradeRepository; forceCompact?: boolean };

export function TradeJournal({ repo, forceCompact }: TradeJournalProps) {
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
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
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
    // Do not auto-create adapters here to keep component testable and avoid require()/dynamic imports.
    // Only warn once in dev
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development')
      console.warn(
        'No TradeRepository provided to TradeJournal; persistence disabled. Provide repo prop from composition root.'
      );
  }

  // Use view model hook to manage positions and actions
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const {
    positions,
    setPositions,
    performAction,
    handleEditorChange,
    handleEditorSave,
    undoInfo,
    handleUndo,
  } = useTradesViewModel({ repoRef, analysisService, setLastStatus });

  // market and status filters (missing earlier) — restore here
  const [marketFilter, setMarketFilter] = useState<'All' | 'Crypto' | 'Forex'>('All');
  const [tradeStatusFilter, setTradeStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED' | 'FILLED'>(
    'ALL'
  );

  // selected trade id for left-right layout
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // compact editor open state (mobile UX): default closed, open on selection
  const [compactEditorOpen, setCompactEditorOpen] = useState<boolean>(false);

  // active tab for the Trades card (list | analysis)
  const [tradesCardTab, setTradesCardTab] = useState<'list' | 'analysis'>('list');

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
            if (isMobile) setCompactEditorOpen(true);
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
                if (isMobile) setCompactEditorOpen(true);
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
    window.addEventListener('open-trade', handler as EventListener);
    return () => window.removeEventListener('open-trade', handler as EventListener);
  }, [positions, isMobile]);

  // small visible status panel (debug) — can be removed later
  const repoEnabled = Boolean(repoRef.current);
  // read user setting and env default for debug UI
  const settings = typeof window !== 'undefined' ? loadSettings() : {};
  const debugUiEnabled =
    typeof settings.debugUI === 'boolean'
      ? settings.debugUI
      : typeof process !== 'undefined' &&
        (process.env.REACT_APP_DEBUG_UI === 'true' || process.env.NODE_ENV === 'development');

  // compute the selected trade DTO once to avoid inline IIFE in JSX (linting + readability)
  const selectedPos = positions.find((p) => p.id === selectedId);
  const selectedTrade = selectedPos
    ? {
        id: selectedPos.id,
        symbol: selectedPos.symbol,
        entryDate: selectedPos.entryDate,
        size: selectedPos.size,
        price: selectedPos.price,
        side: selectedPos.side,
        status: selectedPos.status,
        notes: selectedPos.notes,
        tp1: selectedPos.tp1,
        tp2: selectedPos.tp2,
        tp3: selectedPos.tp3,
        tp4: selectedPos.tp4,
        margin: selectedPos.margin,
        leverage: selectedPos.leverage,
      }
    : null;

  // provide a request-based delete handler for the editor that shows a confirmation dialog.
  // the actual deletion is performed by `performAction('delete', id)` when the user confirms.
  const requestDeleteFromEditor = (id: string): Promise<void> => {
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
          compactGrid
            ? `${styles.grid} ${styles.gridCompact} ${styles.fullScreen}`
            : `${styles.grid} ${styles.fullScreen}`
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
                await analysisService.createAnalysis(payload);
                // optionally switch to list and show created analysis later
                setTradesCardTab('analysis');
              } catch (err) {
                console.warn('Failed to save analysis', err);
              }
            }}
          />
        </div>

        <div className={styles.right}>
          <Card
            tabs={[
              {
                key: 'list',
                title: 'List',
                render: () => (
                  <>
                    <div className={styles.tradesHeader}>
                      <div className={styles.tradesHeaderColumn}>
                        <div className={styles.tradesTitle}>Trades</div>
                        <div className={styles.tradesStatusRow}>
                          <StatusFilters
                            tradeStatusFilter={tradeStatusFilter}
                            setTradeStatusFilter={(s) => setTradeStatusFilter(s)}
                          />
                        </div>
                      </div>
                      <div className={styles.tradesControls}>
                        <MarketFilters
                          marketFilter={marketFilter}
                          setMarketFilter={(m) => setMarketFilter(m)}
                          tradesCount={trades.length}
                        />
                      </div>
                    </div>

                    <div className={styles.listAndDetailWrap}>
                      <TradesPanel
                        tradeListItems={tradeListItems}
                        selectedId={selectedId}
                        onSelect={(id) => setSelectedId(id)}
                        performAction={performAction}
                        compactGrid={compactGrid}
                        compactEditorOpen={compactEditorOpen}
                        setCompactEditorOpen={setCompactEditorOpen}
                        selectedTrade={selectedTrade as unknown as TradeRow}
                        onEditorChange={handleEditorChange}
                        onEditorSave={handleEditorSave}
                        // Use a request-based delete that opens the ConfirmDialog; actual delete runs on confirm
                        onDeleteFromEditor={requestDeleteFromEditor}
                      />
                    </div>
                  </>
                ),
              },
              {
                key: 'analysis',
                title: 'Analyse',
                render: () => <Analysis onCreateTradeSuggestion={handleCreateTradeFromAnalysis} />,
              },
            ]}
            activeTabKey={tradesCardTab}
            onTabChange={(k) => setTradesCardTab(k as 'list' | 'analysis')}
          />
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
