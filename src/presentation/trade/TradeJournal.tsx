import React, { useState, useRef, useEffect, useCallback } from 'react'
// Layout is provided by App; do not render Layout again here to avoid duplicate headers
import { Card } from '@/presentation/shared/components/Card/Card'
import { Button } from '@/presentation/shared/components/Button/Button'
import { SideValue } from '@/presentation/shared/components/SideSelect/SideSelect'
import { validateNewTrade } from '@/presentation/trade/validation'
import styles from './TradeJournal.module.css'
import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository'
import { ConfirmDialog } from '@/presentation/shared/components/ConfirmDialog/ConfirmDialog'
import { TradeList } from './TradeList/TradeList'
import { TradeDetailEditor } from './TradeDetail/TradeDetailEditor'
import { Analysis } from '@/presentation/analysis/Analysis'
import type { MarketValue } from '@/presentation/shared/components/MarketSelect/MarketSelect'
import { TradeFactory } from '@/domain/trade/entities/TradeFactory'
import type { TradeInput } from '@/domain/trade/entities/TradeFactory'
import { EntryDate } from '@/domain/trade/valueObjects/EntryDate'
import { loadSettings } from '@/presentation/settings/settingsStorage'
import { COMBINED_MOCK_TRADES, MORE_CRYPTO_MOCK_TRADES, MORE_FOREX_MOCK_TRADES } from '@/infrastructure/trade/repositories/mockData'
import type { RepoTrade } from '@/infrastructure/trade/repositories/LocalStorageTradeRepository'

// newly extracted presentational components
import { NewTradeForm, type NewTradeFormState } from './components/NewTradeForm/NewTradeForm'
import { MarketFilters, StatusFilters } from './components/TradeFilters/TradeFilters'

type TradeRow = {
  id: string
  market: 'Crypto' | 'Forex' | 'All'
  symbol: string
  entryDate: string
  size: number
  price: number
  side: 'LONG' | 'SHORT'
  status: 'OPEN' | 'CLOSED' | 'FILLED'
  pnl: number
  notes?: string
  entry?: string
  sl?: number
  tp1?: number
  tp2?: number
  tp3?: number
  margin?: number
  leverage?: number
}

type TradeJournalProps = { repo?: TradeRepository, forceCompact?: boolean }

export function TradeJournal({ repo, forceCompact }: TradeJournalProps) {
  // read user setting to decide whether to show Load mock data control
  const [showLoadMockButton, setShowLoadMockButton] = useState<boolean>(() => {
    try {
      const s = loadSettings()
      return typeof s.showLoadMockButton === 'boolean' ? s.showLoadMockButton : true
    } catch (_e) {
      return true
    }
  })
  // keep in sync if settings change elsewhere (optional: could add a storage event listener)
  useEffect(() => {
    const handler = () => {
      try {
        const s = loadSettings()
        setShowLoadMockButton(typeof s.showLoadMockButton === 'boolean' ? s.showLoadMockButton : true)
      } catch (_e) { /* ignore */ }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  // modal state for loading mock data
  const [mockModalOpen, setMockModalOpen] = useState(false)
  const [mockLoadOption, setMockLoadOption] = useState<'crypto' | 'forex' | 'both'>('both')
  const [mockLoading, setMockLoading] = useState(false)

  // repository instance must be injected via props (composition root). Do not require() here.
  const repoRef = useRef<TradeRepository | null>(repo ?? null)
  // Keep ref in sync if prop changes (composition root may re-create repo)
  useEffect(() => { repoRef.current = repo ?? null }, [repo])
  if (!repoRef.current) {
    // Do not auto-create adapters here to keep component testable and avoid require()/dynamic imports.
    // Only warn once in dev
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') console.warn('No TradeRepository provided to TradeJournal; persistence disabled. Provide repo prop from composition root.')
  }

  // State für Positionsdaten (editierbar)
  const [positions, setPositions] = useState<TradeRow[]>([])
  // debug/status for UI (visible) so user sees immediate feedback without console
  const [lastStatus, setLastStatus] = useState<string | null>(null)

  // market and status filters (missing earlier) — restore here
  const [marketFilter, setMarketFilter] = useState<'All' | 'Crypto' | 'Forex'>('All')
  const [tradeStatusFilter, setTradeStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED' | 'FILLED'>('ALL')

  // selected trade id for left-right layout
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // compact editor open state (mobile UX): default closed, open on selection
  const [compactEditorOpen, setCompactEditorOpen] = useState<boolean>(false)

  // active tab for the Trades card (list | analysis)
  const [tradesCardTab, setTradesCardTab] = useState<'list' | 'analysis'>('list')

  // track dirty ids (simple set of ids with local unsaved changes) — we only need the setter
  const [, setDirtyIds] = useState<Set<string>>(new Set())

  // load initial data from repo once on mount
  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!repoRef.current) return
      const domainTrades = await repoRef.current.getAll()
      if (!mounted) return
      // convert domain Trades to presentation primitives
      const all = domainTrades.map(dt => TradeFactory.toDTO(dt))
      setPositions(all as unknown as TradeRow[])
    })()
    return () => { mounted = false }
  }, [])

  // Mobile modal state for New Trade (used on small screens)
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    // jsdom in test environment may not implement matchMedia; guard it
    if (typeof window.matchMedia !== 'function') return false
    try {
      return window.matchMedia('(max-width:480px)').matches
    } catch (_e) {
      return false
    }
  })
  const [newTradeModalOpen, setNewTradeModalOpen] = useState(false)

  // listen for viewport changes to toggle mobile mode
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') return
    const mq = window.matchMedia('(max-width:480px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    try { mq.addEventListener('change', handler) } catch (_e) { mq.addListener(handler) }
    setIsMobile(mq.matches)
    return () => { try { mq.removeEventListener('change', handler) } catch (_e) { mq.removeListener(handler) } }
  }, [])

  // Trades nach Markt filtern (berechnet aus editierbaren Positionen)
  const trades = (() => {
    let filtered = positions
    if (marketFilter !== 'All') filtered = filtered.filter((t) => t.market === marketFilter)
    if (tradeStatusFilter === 'OPEN') filtered = filtered.filter((t) => t.status === 'OPEN')
    if (tradeStatusFilter === 'CLOSED') filtered = filtered.filter((t) => t.status === 'CLOSED')
    if (tradeStatusFilter === 'FILLED') filtered = filtered.filter((t) => t.status === 'FILLED')
    return filtered
  })()

  // Helper: update trade in state and persist to repo
  const updateTradeById = async (id: string, patch: Partial<TradeRow>) => {
    setPositions(prev => {
      const next = prev.map(p => (p.id === id ? { ...p, ...patch } : p))
      // persist updated trade
      const updated = next.find(t => t.id === id)
      if (updated) {
        ;(async () => {
          try {
            if (!repoRef.current) { console.warn('Repository unavailable'); return }
            const domain = TradeFactory.create(updated as any)
            await repoRef.current.update(domain)
          } catch (err) {
            console.error('Failed to persist trade update', err)
          }
        })()
      }
      return next
    })
  }

  // Called by editor when fields change; mark as dirty and update local positions
  // Editor works with the presentation DTO shape (id, symbol, entryDate?, size, price, side, notes)
  type EditorDTO = { id: string; symbol: string; entryDate?: string; size: number; price: number; side: string; notes?: string; status?: 'OPEN' | 'CLOSED' | 'FILLED' }

  const handleEditorChange = useCallback((dto: EditorDTO) => {
    setPositions(prev => prev.map(p => (p.id === dto.id ? ({
      ...p,
      symbol: dto.symbol,
      entryDate: dto.entryDate ?? p.entryDate,
      size: dto.size,
      price: dto.price,
      side: dto.side as 'LONG' | 'SHORT',
      status: (dto as any).status ?? p.status,
      notes: dto.notes
    }) : p)))
    setDirtyIds(prev => {
      const next = new Set(prev)
      next.add(dto.id)
      return next
    })
  }, [])

  // Called by editor to persist change immediately (accepts DTO)
  const handleEditorSave = useCallback(async (dto: EditorDTO) => {
    let updatedTrade: TradeRow | null = null
    setPositions(prev => {
      const existing = prev.find(p => p.id === dto.id)
      if (!existing) return prev
      updatedTrade = {
        ...existing,
        symbol: dto.symbol,
        entryDate: dto.entryDate ?? existing.entryDate,
        size: dto.size,
        price: dto.price,
        side: dto.side as 'LONG' | 'SHORT',
        status: (dto as any).status ?? existing.status,
        notes: dto.notes
      }
      return prev.map(p => (p.id === dto.id ? updatedTrade! : p))
    })

    if (!updatedTrade) {
      console.error('Save failed: trade not found', dto.id)
      return
    }

    try {
      if (!repoRef.current) { console.warn('Repository unavailable'); return }
      const domain = TradeFactory.create(updatedTrade as any)
      await repoRef.current.update(domain)
      setDirtyIds(prev => {
        const next = new Set(prev)
        next.delete(dto.id)
        return next
      })
    } catch (err) {
      console.error('Save failed', err)
    }
  }, [])

  // Handler für das Hinzufügen eines neuen Trades
  type NewTradeForm = NewTradeFormState

  const [form, setForm] = useState<NewTradeForm>({
    symbol: '',
    entryDate: EntryDate.toInputValue(),
    size: undefined,
    price: undefined,
    side: 'LONG',
    status: 'OPEN',
    market: 'Crypto', // default to Crypto to avoid validation blocking when user doesn't explicitly select
    notes: ''
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  // Track which fields the user has interacted with; errors are shown only when touched or after submit
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [formSubmitted, setFormSubmitted] = useState(false)
  // key to force remount the New Trade form and its inputs (useful to fully clear internal input state)
  const [formKey, setFormKey] = useState(0)

    const handleAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setFormSubmitted(true)
    console.info('[TradeJournal] handleAdd start', { form })
    setLastStatus('handleAdd start')

    // helper: parse form values which may be strings -> numbers
    const parseNumberField = (v: any): number | undefined => {
      if (v === undefined || v === null) return undefined
      if (typeof v === 'number') return v
      const s = String(v).trim()
      if (s.length === 0) return undefined
      const n = Number(s)
      return Number.isNaN(n) ? undefined : n
    }

    // Validate using presentation validation helper (returns array of field errors)
    const toValidate = {
      symbol: form.symbol,
      entryDate: form.entryDate,
      size: parseNumberField(form.size) ?? undefined,
      price: parseNumberField(form.price) ?? undefined,
      side: form.side as string,
      market: (form.market ?? '') as MarketValue,
      sl: form.sl,
      margin: form.margin,
      leverage: form.leverage
    }
    const validation = validateNewTrade(toValidate as any)
    const mapped: Record<string, string> = {}
    validation.forEach((v) => {
      if (v && v.field) mapped[v.field] = v.message
    })
    if (Object.keys(mapped).length > 0) {
      setFormErrors(mapped)
      console.info('[TradeJournal] validation failed', mapped)
      setLastStatus(`validation failed: ${Object.keys(mapped).join(',')}`)
      // mark all errored fields as touched so UI shows the messages immediately
      setTouched(prev => ({ ...prev, ...Object.fromEntries(Object.keys(mapped).map(k => [k, true])) }))
      return
    }

    const newTrade: TradeRow = {
      id: crypto.randomUUID(),
      symbol: form.symbol,
      entryDate: form.entryDate,
      size: Number(form.size),
      price: Number(form.price),
      side: form.side as 'LONG' | 'SHORT',
      notes: form.notes,
      market: (form.market as Exclude<MarketValue, ''>) || 'Crypto',
      sl: form.sl,
      tp1: form.tp1,
      tp2: form.tp2,
      tp3: form.tp3,
      margin: form.margin,
      leverage: form.leverage,
      status: form.status,
      pnl: 0,
    }

    try {
      if (!repoRef.current) {
        console.warn('[TradeJournal] Repository unavailable; skipping persistence')
        setLastStatus('repo unavailable; local update')
        // fallback: update local positions only
        setPositions(prev => {
          const next = [newTrade, ...prev]
          console.info('[TradeJournal] positions updated (local, no repo)', next.length)
          return next
        })
      } else {
        console.info('[TradeJournal] persisting trade to repo', newTrade.id)
        setLastStatus(`persisting ${newTrade.id}`)
        const domain = TradeFactory.create(newTrade as any)
        await repoRef.current.save(domain)
        console.info('[TradeJournal] persisted trade to repo', newTrade.id)
        setLastStatus(`persisted ${newTrade.id}`)

        // reload canonical trades from repo to keep UI in sync with storage
        try {
          const domainTrades = await repoRef.current.getAll()
          const dtoTrades = domainTrades.map(dt => TradeFactory.toDTO(dt) as unknown as TradeRow)
          setPositions(dtoTrades)
          console.info('[TradeJournal] reloaded positions from repo', dtoTrades.length)
          setLastStatus(`reloaded ${dtoTrades.length} trades from repo`)
        } catch (err) {
          console.warn('[TradeJournal] failed to reload from repo after save, falling back to local update', err)
          setLastStatus('reload failed; fallback to local')
          setPositions(prev => [newTrade, ...prev])
        }
      }
      setLastStatus('Saved')
      // If we added a trade from the mobile modal, close it and reset form
      if (newTradeModalOpen) {
        setNewTradeModalOpen(false)
      }
      // reset form
      setForm({ symbol: '', entryDate: EntryDate.toInputValue(), size: undefined, price: undefined, side: 'LONG', status: 'OPEN', market: 'Crypto', notes: '' })
      setFormSubmitted(false)
      setFormKey(k => k + 1)
    } catch (err) {
      console.error('[TradeJournal] Failed to persist new trade to repository', err)
      setLastStatus('persist error')
      // still update UI so user sees the trade; but surface error in console
      setPositions(prev => [newTrade, ...prev])
    }
    setFormErrors({})
    // clear submission / touched state after successful add
    setFormSubmitted(false)
    setTouched({})
    }

  // responsive fallback: switch to single-column grid when container is too narrow
  const containerRef = useRef<HTMLDivElement | null>(null)
   const [compactGrid, setCompactGrid] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // If caller forces compact mode (useful for testing or feature flags), respect it and skip ResizeObserver
    if (typeof forceCompact === 'boolean') {
      setCompactGrid(forceCompact)
      return
    }

    const tableMin = 900 // same as our table min-width
    const gap = 18
    const extraBuffer = 220 // increase buffer to avoid overlap when window moved/resized

    const compute = () => {
      const style = getComputedStyle(el)
      const paddingLeft = parseInt(style.paddingLeft || '0', 10)
      const paddingRight = parseInt(style.paddingRight || '0', 10)
      const available = el.clientWidth - paddingLeft - paddingRight

      // compute left width using the clamp formula: clamp(280px, 22vw, 420px)
      const vw22 = Math.round((el.clientWidth * 22) / 100)
      const leftPreferred = Math.min(Math.max(280, vw22), 420)

      const required = leftPreferred + tableMin + gap + extraBuffer
      // if available width is less than required, switch to compact
      setCompactGrid(available < required)
    }

    const ro = new ResizeObserver(compute)
    ro.observe(el)

    // initial check
    compute()

    return () => ro.disconnect()
  }, [forceCompact])

  // Confirmation dialog state for SL/close actions
   const [confirmOpen, setConfirmOpen] = useState(false)
   const [confirmTradeId, setConfirmTradeId] = useState<string | null>(null)
   const [confirmAction, setConfirmAction] = useState<'close' | 'sl-be' | 'sl-hit' | 'toggle-side' | 'delete' | null>(null)
  // allow undo: store previous trade snapshot and show small undo banner
  const [undoInfo, setUndoInfo] = useState<{ id: string; prev: TradeRow } | null>(null)
  const undoTimerRef = useRef<number | null>(null)

  const clearUndo = () => {
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current)
    undoTimerRef.current = null
    setUndoInfo(null)
  }

  const performAction = (action: NonNullable<typeof confirmAction>, id: string) => {
    const prev = positions.find(p => p.id === id)
    if (!prev) return
    const prevCopy = { ...prev }

    if (action === 'toggle-side') {
      const newSide = prev.side === 'LONG' ? 'SHORT' : 'LONG'
      updateTradeById(id, { side: newSide })
    } else if (action === 'sl-be') {
      // prev.entry may be a string (ISO) or undefined; coerce to number if possible
      const entryAsNumber = prev.entry ? Number(prev.entry) : undefined
      const chosenSl = (typeof entryAsNumber === 'number' && !Number.isNaN(entryAsNumber)) ? entryAsNumber : prev.sl
      updateTradeById(id, { sl: chosenSl, status: 'CLOSED' })
    } else if (action === 'sl-hit') {
      updateTradeById(id, { status: 'CLOSED' })
    } else if (action === 'close') {
      // user-initiated close -> mark as FILLED (semantic choice)
      updateTradeById(id, { status: 'FILLED' })
    } else if (action === 'delete') {
      // handle delete locally and in repo
      // set undo info and remove from positions; actual repo deletion will be performed below
      if (!prev) return
      setPositions(prevs => prevs.filter(p => p.id !== id))
      ;(async () => {
        try {
          if (!repoRef.current) return
          await repoRef.current.delete(id)
        } catch (err) {
          console.error('Failed to delete trade from repo', err)
        }
      })()
      // if the deleted trade was selected in the editor, clear selection
      if (selectedId === id) setSelectedId(null)
     }

    // set undo info and auto-clear after 5s
    setUndoInfo({ id, prev: prevCopy })
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current)
    undoTimerRef.current = window.setTimeout(() => {
      setUndoInfo(null)
      undoTimerRef.current = null
    }, 5000)
  }

  const handleConfirm = () => {
    if (!confirmAction || !confirmTradeId) return
    performAction(confirmAction, confirmTradeId)
    setConfirmOpen(false)
    setConfirmAction(null)
    setConfirmTradeId(null)
  }

  const handleCancelConfirm = () => {
    setConfirmOpen(false)
    setConfirmAction(null)
    setConfirmTradeId(null)
  }

  // Request delete flow: open confirm dialog with 'delete' action
  const requestDeleteTrade = (id: string) => {
    setConfirmTradeId(id)
    setConfirmAction('delete')
    setConfirmOpen(true)
  }

  const handleUndo = () => {
    if (!undoInfo) return
    updateTradeById(undoInfo.id, undoInfo.prev)
    clearUndo()
  }

  // onDelete passed to TradeDetailEditor - shows confirm dialog and then deletes
  const handleDeleteFromEditor = async (id: string) => {
    // Use confirm dialog for UX consistency
    requestDeleteTrade(id)
  }

  // helper: ISO string -> datetime-local format used by input[type=datetime-local]
  const toDatetimeLocal = (iso?: string) => {
    const d = iso ? new Date(iso) : new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const min = pad(d.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`
  }

  // PREFILL the New Trade form from an analysis suggestion (no auto-persist)
  const handleCreateTradeFromAnalysis = async (s: import('@/presentation/analysis/Analysis').AnalysisSuggestion) => {
    const entryDateLocal = toDatetimeLocal(s.entryDate)
    setForm({
      symbol: s.symbol,
      entryDate: entryDateLocal,
      size: s.size ?? undefined,
      price: s.price ?? undefined,
      side: (s.side ?? 'LONG') as SideValue,
      market: (s.market ?? '') as MarketValue,
      notes: `Suggested from analysis (${s.market ?? 'unspecified'})`,
      status: 'OPEN'
    })
    // switch to list view so the user can review the New Trade form in the left column
    setTradesCardTab('list')
    setMarketFilter(s.market ?? 'All')
    setSelectedId(null)
  }

  // helper: reset New Trade form to initial state
  const resetNewTradeForm = () => {
    // Use case: allow the user to reset the New Trade form to sensible defaults
    // (keeps default side: LONG and status: OPEN). This is a true "reset" action
    // distinct from closing/canceling the panel — it clears inputs while keeping
    // the New Trade UI open so the user can start again.
    setForm({
      symbol: '',
      entryDate: EntryDate.toInputValue(),
      size: undefined,
      price: undefined,
      side: 'LONG',
      status: 'OPEN',
      market: 'Crypto',
      notes: '',
      sl: undefined,
      tp1: undefined,
      tp2: undefined,
      tp3: undefined,
      leverage: undefined,
      margin: undefined,
    })
    setFormErrors({})
    // also clear touched and submitted state so no errors are visible after reset
    setTouched({})
    setFormSubmitted(false)
    // force remount of form to clear any input internal state / visual artifacts
    setFormKey((k) => k + 1)
  }

  // small visible status panel (debug) — can be removed later
  const repoEnabled = Boolean(repoRef.current)
  // read user setting and env default for debug UI
  const settings = typeof window !== 'undefined' ? loadSettings() : {}
  const debugUiEnabled = typeof settings.debugUI === 'boolean' ? settings.debugUI : (typeof process !== 'undefined' && (process.env.REACT_APP_DEBUG_UI === 'true' || process.env.NODE_ENV === 'development'))

  // compute the selected trade DTO once to avoid inline IIFE in JSX (linting + readability)
  const selectedPos = positions.find((p) => p.id === selectedId)
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
      }
    : null

    return (
    <>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Trading Journal</h2>
        <div className={styles.controls}>
          {showLoadMockButton && <Button variant="secondary" onClick={() => setMockModalOpen(true)}>Load mock data</Button>}
        </div>
      </div>

      {/* Mobile-only New Trade button: opens modal instead of showing inline form */}
      <div className={styles.mobileNewTradeBtnWrap}>
        {isMobile && (
          <button type="button" className={styles.mobileNewTradeBtn} onClick={() => setNewTradeModalOpen(true)}>
            New Trade
          </button>
        )}
      </div>

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
          {/* Desktop & tablet: show inline NewTradeForm; Mobile: hide inline and use modal */}
          {!isMobile && (
            <NewTradeForm
              form={form}
              formErrors={formErrors}
              touched={touched}
              formSubmitted={formSubmitted}
              formKey={formKey}
              debugUiEnabled={debugUiEnabled}
              lastStatus={lastStatus}
              onChangeForm={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
              onBlurField={(f) => setTouched((prev) => ({ ...prev, [f]: true }))}
              onSubmit={(e?: React.FormEvent) => { setFormSubmitted(true); setTouched(prev => ({ ...prev, price: true })); handleAdd(e) }}
              onReset={resetNewTradeForm}
              setMarketFilter={(m) => setMarketFilter(m === '' ? 'All' : (m as 'All' | 'Crypto' | 'Forex'))}
            />
          )}
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
                       <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                         <div className={styles.tradesTitle}>Trades</div>
                         <div className={styles.tradesStatusRow}>
                           <StatusFilters tradeStatusFilter={tradeStatusFilter} setTradeStatusFilter={(s) => setTradeStatusFilter(s)} />
                         </div>
                       </div>
                       <div className={styles.tradesControls}>
                         <MarketFilters marketFilter={marketFilter} setMarketFilter={(m) => setMarketFilter(m)} tradesCount={trades.length} />
                       </div>
                     </div>

                     <div className={styles.listAndDetailWrap}>
                       {/* Correct conditional rendering: when compactGrid is true stack list and editor in leftPane; otherwise keep leftPane + rightPane */}
                       {compactGrid ? (
                         <div className={styles.leftPane}>
                           <TradeList
                             trades={trades.map((t) => ({
                               id: t.id,
                               symbol: t.symbol,
                               entryDate: t.entryDate,
                               size: t.size,
                               price: t.price,
                               side: t.side,
                               status: t.status,
                               notes: t.notes,
                             }))}
                             selectedId={selectedId}
                             onSelect={(id) => setSelectedId(id)}
                             compactView={compactGrid}
                           />
                           <div style={{ height: 12 }} />
                           {selectedTrade ? (
                             compactEditorOpen ? (
                               <div>
                                 <div className={styles.compactControls}>
                                   <Button variant="ghost" onClick={() => setCompactEditorOpen(false)}>Hide details</Button>
                                 </div>
                                 <TradeDetailEditor
                                   trade={selectedTrade}
                                   onChange={handleEditorChange}
                                   onSave={handleEditorSave}
                                   onDelete={(id) => handleDeleteFromEditor(id)}
                                   compactView={compactGrid}
                                 />
                               </div>
                             ) : (
                               <div className={styles.compactSummary} role="region" aria-live="polite">
                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                   <div>
                                     <div style={{ fontWeight: 700 }}>{selectedTrade.symbol}</div>
                                     <div style={{ color: 'var(--muted)', fontSize: 13 }}>{new Date(selectedTrade.entryDate).toLocaleString()}</div>
                                   </div>
                                   <div>
                                     <Button variant="primary" onClick={() => setCompactEditorOpen(true)}>Show details</Button>
                                   </div>
                                 </div>
                               </div>
                             )
                           ) : (
                             <div className={styles.compactPlaceholder} role="region" aria-live="polite">
                               <div style={{ fontWeight: 700, marginBottom: 6 }}>Keine Auswahl</div>
                               <div style={{ color: 'var(--muted)' }}>Wähle einen Trade in der Liste, um die Details zu bearbeiten.</div>
                             </div>
                           )}
                         </div>
                       ) : (
                         <>
                           <div className={styles.leftPane}>
                             <TradeList
                               trades={trades.map((t) => ({
                                 id: t.id,
                                 symbol: t.symbol,
                                 entryDate: t.entryDate,
                                 size: t.size,
                                 price: t.price,
                                 side: t.side,
                                 status: t.status,
                                 notes: t.notes,
                               }))}
                               selectedId={selectedId}
                               onSelect={(id) => setSelectedId(id)}
                               compactView={compactGrid}
                             />
                           </div>

                           <div className={styles.rightPane}>
                             <TradeDetailEditor
                               trade={selectedTrade}
                               onChange={handleEditorChange}
                               onSave={handleEditorSave}
                               onDelete={(id) => handleDeleteFromEditor(id)}
                             />
                           </div>
                         </>
                       )}
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
      {mockModalOpen && (
        <div className={styles.backdrop} role="dialog" aria-modal="true">
          <div className={styles.mockDialog}>
            <h3>Lade Mock-Daten</h3>
            <p>Wähle welches Set an Testdaten du laden möchtest. Bereits vorhandene Daten bleiben erhalten.</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 12 }}>
              <Button variant={mockLoadOption === 'crypto' ? 'primary' : 'ghost'} onClick={() => setMockLoadOption('crypto')}>Crypto</Button>
              <Button variant={mockLoadOption === 'forex' ? 'primary' : 'ghost'} onClick={() => setMockLoadOption('forex')}>Forex</Button>
              <Button variant={mockLoadOption === 'both' ? 'primary' : 'ghost'} onClick={() => setMockLoadOption('both')}>Both</Button>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setMockModalOpen(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={async () => {
                  setMockLoading(true)
                  try {
                    const seedSet = mockLoadOption === 'crypto' ? MORE_CRYPTO_MOCK_TRADES : mockLoadOption === 'forex' ? MORE_FOREX_MOCK_TRADES : COMBINED_MOCK_TRADES

                    // prefer calling a seed method if repo supports it
                    const repoAny = repoRef.current as unknown as { seed?: (trades: RepoTrade[]) => void; save?: (t: any) => Promise<void>; getAll?: () => Promise<any[]> } | null
                    if (repoAny && typeof repoAny.seed === 'function') {
                      try { repoAny.seed(seedSet as RepoTrade[]) } catch (err) { console.error('seed() call failed', err) }
                    } else if (repoAny && typeof repoAny.save === 'function') {
                      // save each trade sequentially
                      for (const rt of seedSet) {
                        try {
                          const domain = TradeFactory.create(rt as unknown as TradeInput)
                          await repoAny.save(domain)
                        } catch (err) {
                          console.error('Failed to save mock trade via save()', err)
                        }
                      }
                    } else {
                      // no repo available - update UI only
                      // Normalize status to avoid UNKNOWN values in the list when mock items lack a status
                      setPositions(prev => {
                        const combined = seedSet.map(t => ({ ...t }))
                        const dto = combined.map(c => ({
                          ...c,
                          entryDate: EntryDate.toInputValue(c.entryDate),
                          status: (c as any).status ?? 'OPEN'
                        })) as unknown as TradeRow[]
                        return [...dto, ...prev]
                      })
                    }

                    // reload canonical trades from repo
                    if (repoRef.current && typeof repoRef.current.getAll === 'function') {
                      const domainTrades = await repoRef.current.getAll()
                      const dtoTrades = domainTrades.map(dt => TradeFactory.toDTO(dt) as unknown as TradeRow)
                      setPositions(dtoTrades)
                    }
                  } finally {
                    setMockLoading(false)
                    setMockModalOpen(false)
                  }
                }}
              >
                {mockLoading ? 'Loading…' : 'Load'}
              </Button>
            </div>
          </div>
        </div>
      )}

       {undoInfo && (
         <div className={styles.undoBanner}>
           <div className={styles.undoContent}>
             <div>Aktion durchgeführt — Rückgängig möglich</div>
             <Button variant="ghost" onClick={handleUndo}>
               Rückgängig
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
      {/* Mobile modal for New Trade */}
      {isMobile && newTradeModalOpen && (
        <div className={styles.mobileModalBackdrop} role="dialog" aria-modal="true" tabIndex={-1}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setNewTradeModalOpen(false)}
        >
          <div
            className={styles.mobileModalContent}
            style={{
              background: 'var(--card-bg, #fff)',
              borderRadius: 12,
              maxWidth: 400,
              width: '90vw',
              padding: 24,
              boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
            tabIndex={0}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setNewTradeModalOpen(false)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'none',
                border: 'none',
                fontSize: 22,
                cursor: 'pointer'
              }}
            >
              ×
            </button>
            <div style={{ marginBottom: 12, fontWeight: 700, fontSize: 18 }}>New Trade</div>
            <NewTradeForm
              form={form}
              formErrors={formErrors}
              touched={touched}
              formSubmitted={formSubmitted}
              formKey={formKey}
              debugUiEnabled={debugUiEnabled}
              lastStatus={lastStatus}
              onChangeForm={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
              onBlurField={(f) => setTouched((prev) => ({ ...prev, [f]: true }))}
              onSubmit={(e?: React.FormEvent) => { setFormSubmitted(true); setTouched(prev => ({ ...prev, price: true })); handleAdd(e) }}
              onReset={resetNewTradeForm}
              setMarketFilter={(m) => setMarketFilter(m === '' ? 'All' : (m as 'All' | 'Crypto' | 'Forex'))}
            />
          </div>
        </div>
      )}
    </>
     );
    }
