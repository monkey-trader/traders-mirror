import React, { useState, useRef, useEffect } from 'react'
// Layout is provided by App; do not render Layout again here to avoid duplicate headers
import { Card } from '@/presentation/shared/components/Card/Card'
import { Button } from '@/presentation/shared/components/Button/Button'
import { Input } from '@/presentation/shared/components/Input/Input'
import { SideSelect, SideValue } from '@/presentation/shared/components/SideSelect/SideSelect'
import { validateNewTrade } from '@/presentation/trade/validation'
import styles from './TradeJournal.module.css'
import InMemoryTradeRepository from '@/infrastructure/trade/repositories/InMemoryTradeRepository'
import { ConfirmDialog } from '@/presentation/shared/components/ConfirmDialog/ConfirmDialog'
import { TradeList } from './TradeList/TradeList'
import { TradeDetailEditor } from './TradeDetail/TradeDetailEditor'
import { Analysis } from '@/presentation/analysis/Analysis'
import MarketSelect, { MarketValue } from '@/presentation/shared/components/MarketSelect/MarketSelect'

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
  tp1?: string
  tp2?: string
  tp3?: string
  margin?: number
  leverage?: number
}

export function TradeJournal() {
  const [marketFilter, setMarketFilter] = useState<'All' | 'Crypto' | 'Forex'>('All')
  const [tradeStatusFilter, setTradeStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED' | 'FILLED'>('ALL')

  // repository instance (in-memory for demo)
  const repoRef = useRef(new InMemoryTradeRepository())

  // State für Positionsdaten (editierbar)
  const [positions, setPositions] = useState<TradeRow[]>([])

  // selected trade id for left-right layout
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // active tab for the Trades card (list | analysis)
  const [tradesCardTab, setTradesCardTab] = useState<'list' | 'analysis'>('list')

  // track dirty ids (simple set of ids with local unsaved changes) — we only need the setter
  const [, setDirtyIds] = useState<Set<string>>(new Set())

  // load initial data from repo once on mount
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const all = await repoRef.current.getAll()
      if (!mounted) return
      // initial load from repo
      setPositions(all as unknown as TradeRow[])
    })()
    return () => { mounted = false }
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
            await repoRef.current.update(updated as any)
          } catch (err) {
            console.error('Failed to persist trade update', err)
          }
        })()
      }
      return next
    })
  }

  // Called by editor when fields change; mark as dirty and update local positions
  // Editor works with the presentation DTO shape (id, symbol, entryDate, size, price, side, notes)
  type EditorDTO = { id: string; symbol: string; entryDate: string; size: number; price: number; side: string; notes?: string }

  const handleEditorChange = (dto: EditorDTO) => {
    setPositions(prev => prev.map(p => (p.id === dto.id ? ({ ...p, symbol: dto.symbol, entryDate: dto.entryDate, size: dto.size, price: dto.price, side: dto.side as 'LONG' | 'SHORT', notes: dto.notes }) : p)))
    setDirtyIds(prev => new Set(prev).add(dto.id))
  }

  // Called by editor to persist change immediately (accepts DTO)
  const handleEditorSave = async (dto: EditorDTO) => {
    const existing = positions.find(p => p.id === dto.id)
    if (!existing) {
      console.error('Save failed: trade not found', dto.id)
      return
    }
    const updated = { ...existing, symbol: dto.symbol, entryDate: dto.entryDate, size: dto.size, price: dto.price, side: dto.side as 'LONG' | 'SHORT', notes: dto.notes }
    try {
      await repoRef.current.update(updated as any)
      setPositions(prev => prev.map(p => (p.id === dto.id ? updated : p)))
      setDirtyIds(prev => {
        const next = new Set(prev)
        next.delete(dto.id)
        return next
      })
    } catch (err) {
      console.error('Save failed', err)
      // do not rethrow to avoid caught-throw warning in build; caller can check side-effects
    }
  }

  // Handler für das Hinzufügen eines neuen Trades
  type NewTradeForm = {
    symbol: string
    entryDate: string
    size?: number
    price?: number
    side: SideValue
    status: 'OPEN' | 'CLOSED' | 'FILLED'
    notes: string
    sl?: number
    tp1?: string
    tp2?: string
    tp3?: string
    leverage?: number
    margin?: number
    market?: MarketValue
  }

  const [form, setForm] = useState<NewTradeForm>({
    symbol: '',
    entryDate: '',
    size: undefined,
    price: undefined,
    side: 'LONG',
    status: 'OPEN',
    market: undefined,
    notes: ''
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()

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
    setPositions(prev => [newTrade, ...prev])
    setForm({ symbol: '', entryDate: '', size: undefined, price: undefined, side: 'LONG', status: 'OPEN', market: undefined, notes: '' })
    setFormErrors({})
  }

  // responsive fallback: switch to single-column grid when container is too narrow
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [compactGrid, setCompactGrid] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

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
  }, [])

  // Confirmation dialog state for SL/close actions
   const [confirmOpen, setConfirmOpen] = useState(false)
   const [confirmTradeId, setConfirmTradeId] = useState<string | null>(null)
   const [confirmAction, setConfirmAction] = useState<'close' | 'sl-be' | 'sl-hit' | 'toggle-side' | null>(null)
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

  const handleUndo = () => {
    if (!undoInfo) return
    updateTradeById(undoInfo.id, undoInfo.prev)
    clearUndo()
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
      size: s.size ?? 1,
      price: s.price ?? 0,
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

  return (
    <>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Trading Journal</h2>
        <div className={styles.controls}>{/* moved market filters next to Trades title */}</div>
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
          <Card>
            <div className={styles.newTradeWrapper}>
              <div className={styles.newTradeHeader}>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>New Trade</span>
              </div>

              <form className={styles.form} onSubmit={handleAdd}>
                <div className={styles.newTradeGrid}>
                  {/* Row 1: Symbol | Market */}
                  <div className={styles.newTradeField}>
                    <Input
                      id="symbol"
                      label="Symbol"
                      placeholder="e.g. BTC"
                      value={form.symbol}
                      onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                      hasError={Boolean(formErrors.symbol)}
                      aria-describedby={formErrors.symbol ? 'symbol-error' : undefined}
                    />
                    {formErrors.symbol && <div id="symbol-error" className={styles.fieldError}>{formErrors.symbol}</div>}
                  </div>

                  <div className={styles.newTradeField}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className={styles.fieldLabel}>Market</span>
                      <MarketSelect
                        value={(form.market ?? '') as MarketValue}
                        onChange={(v) => {
                          setForm({ ...form, market: v })
                          if (v) {
                            setMarketFilter(v)
                            setFormErrors({})
                          }
                        }}
                        compact
                        showAll={false}
                      />
                    </div>
                    {formErrors.market && <div className={styles.fieldError}>{formErrors.market}</div>}
                  </div>

                  {/* Row 2: Side | Entry Price */}
                  <div className={styles.newTradeField}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className={styles.fieldLabel}>Side</span>
                      <SideSelect
                        value={form.side as SideValue}
                        onChange={(v) => setForm({ ...form, side: v })}
                        ariaLabel="New trade side"
                        showBadge={false}
                        colored
                      />
                    </div>
                  </div>

                  <div className={styles.newTradeField}>
                    <Input
                      id="price"
                      label="Entry Price *"
                      type="number"
                      value={typeof form.price === 'number' ? String(form.price) : ''}
                      onChange={(e) => {
                        const v = e.target.value
                        setForm({ ...form, price: v === '' ? undefined : Number(v) })
                      }}
                      hasError={Boolean(formErrors.price)}
                      aria-describedby={formErrors.price ? 'price-error' : undefined}
                    />
                    {formErrors.price && <div id="price-error" className={styles.fieldError}>{formErrors.price}</div>}
                  </div>

                  {/* Row 3: Margin | Leverage will follow (shifted down) */}
                  <div className={styles.newTradeField}>
                    <Input
                      id="margin"
                      label="Margin *"
                      type="number"
                      value={typeof form.margin === 'number' ? String(form.margin) : ''}
                      onChange={(e) => {
                        const v = e.target.value
                        setForm({ ...form, // @ts-ignore
                          margin: v === '' ? undefined : Number(v) })
                      }}
                      hasError={Boolean(formErrors.margin)}
                      aria-describedby={formErrors.margin ? 'margin-error' : undefined}
                    />
                    {formErrors.margin && <div id="margin-error" className={styles.fieldError}>{formErrors.margin}</div>}
                  </div>
                  <div className={styles.newTradeField}>
                    <Input
                      id="leverage"
                      label="Leverage *"
                      type="number"
                      value={typeof form.leverage === 'number' ? String(form.leverage) : ''}
                      onChange={(e) => {
                        const v = e.target.value
                        setForm({ ...form, // @ts-ignore
                          leverage: v === '' ? undefined : Number(v) })
                      }}
                      hasError={Boolean(formErrors.leverage)}
                      aria-describedby={formErrors.leverage ? 'leverage-error' : undefined}
                    />
                    {formErrors.leverage && <div id="leverage-error" className={styles.fieldError}>{formErrors.leverage}</div>}
                  </div>
                  <div className={styles.newTradeField}>
                    <Input
                      id="size"
                      label="Position Size *"
                      type="number"
                      value={typeof form.size === 'number' ? String(form.size) : ''}
                      onChange={(e) => {
                        const v = e.target.value
                        setForm({ ...form, size: v === '' ? undefined : Number(v) })
                      }}
                      hasError={Boolean(formErrors.size)}
                      aria-describedby={formErrors.size ? 'size-error' : undefined}
                    />
                    {formErrors.size && <div id="size-error" className={styles.fieldError}>{formErrors.size}</div>}
                  </div>

                  {/* Row 4: SL | TP1 */}
                  <div className={styles.newTradeField}>
                    <Input
                      id="sl"
                      label="Stop Loss (SL) *"
                      type="number"
                      value={typeof form.sl === 'number' ? String(form.sl) : ''}
                      onChange={(e) => {
                        const v = e.target.value
                        setForm({ ...form, // @ts-ignore
                          sl: v === '' ? undefined : Number(v) })
                      }}
                      hasError={Boolean(formErrors.sl)}
                      aria-describedby={formErrors.sl ? 'sl-error' : undefined}
                    />
                    {formErrors.sl && <div id="sl-error" className={styles.fieldError}>{formErrors.sl}</div>}
                  </div>

                  <div className={styles.newTradeField}>
                    <Input
                      id="tp1"
                      label="TP1"
                      value={(form as any).tp1 ?? ''}
                      onChange={(e) =>
                        setForm({
                          ...form, // @ts-ignore
                          tp1: e.target.value,
                        })
                      }
                      hasError={Boolean(formErrors.tp1)}
                      aria-describedby={formErrors.tp1 ? 'tp1-error' : undefined}
                    />
                    {formErrors.tp1 && <div id="tp1-error" className={styles.fieldError}>{formErrors.tp1}</div>}
                  </div>

                  {/* Row 5: TP2 | TP3 */}
                  <div className={styles.newTradeField}>
                    <Input
                      id="tp2"
                      label="TP2"
                      value={(form as any).tp2 ?? ''}
                      onChange={(e) =>
                        setForm({
                          ...form, // @ts-ignore
                          tp2: e.target.value,
                        })
                      }
                      hasError={Boolean(formErrors.tp2)}
                      aria-describedby={formErrors.tp2 ? 'tp2-error' : undefined}
                    />
                    {formErrors.tp2 && <div id="tp2-error" className={styles.fieldError}>{formErrors.tp2}</div>}
                  </div>

                  <div className={styles.newTradeField}>
                    <Input
                      id="tp3"
                      label="TP3"
                      value={(form as any).tp3 ?? ''}
                      onChange={(e) =>
                        setForm({
                          ...form, // @ts-ignore
                          tp3: e.target.value,
                        })
                      }
                      hasError={Boolean(formErrors.tp3)}
                      aria-describedby={formErrors.tp3 ? 'tp3-error' : undefined}
                    />
                    {formErrors.tp3 && <div id="tp3-error" className={styles.fieldError}>{formErrors.tp3}</div>}
                  </div>

                  {/* Row 6: Notes full-width */}
                  <div className={`${styles.newTradeField} ${styles.full}`}>
                    <Input
                      label="Notes"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>

                  {/* Status row (full width) */}
                  <div className={`${styles.newTradeField} ${styles.full}`}>
                    <label style={{ color: 'var(--muted)', marginBottom: 6 }}>Status</label>
                    <select
                      className={styles.input}
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as 'OPEN' | 'CLOSED' | 'FILLED' })}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="CLOSED">CLOSED</option>
                      <option value="FILLED">FILLED</option>
                    </select>
                  </div>
                </div>

                <div className={styles.actions} style={{ marginTop: 12 }}>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setForm({
                        symbol: '',
                        entryDate: '',
                        size: undefined,
                        price: undefined,
                        side: 'LONG',
                        status: 'OPEN',
                        market: undefined,
                        notes: '',
                        sl: undefined,
                        tp1: '',
                        tp2: '',
                        tp3: '',
                        leverage: undefined,
                        margin: undefined,
                      })
                      setFormErrors({})
                    }}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={() => { /* submit: form is in enclosing form element so native submit will call handleAdd */ }}>
                    Add
                  </Button>
                </div>
              </form>
            </div>
          </Card>
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
                      <div className={styles.tradesTitle}>Trades</div>
                      <div className={styles.tradesControls}>
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
                        </div>
                        <div className={styles.tradesCount}>{trades.length} trades</div>
                      </div>
                    </div>

                    <div className={styles.controls} style={{ marginBottom: 8 }}>
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

                    <div className={styles.listAndDetailWrap}>
                      <div className={styles.leftPane}>
                        <TradeList
                          trades={trades.map(t => ({ id: t.id, symbol: t.symbol, entryDate: t.entryDate, size: t.size, price: t.price, side: t.side, notes: t.notes }))}
                          selectedId={selectedId}
                          onSelect={(id) => setSelectedId(id)}
                        />
                      </div>

                      <div className={styles.rightPane}>
                        <TradeDetailEditor
                          trade={(() => {
                            const p = positions.find((p) => p.id === selectedId);
                            return p
                              ? {
                                  id: p.id,
                                  symbol: p.symbol,
                                  entryDate: p.entryDate,
                                  size: p.size,
                                  price: p.price,
                                  side: p.side,
                                  notes: p.notes,
                                }
                              : null;
                          })()}
                          onChange={(dto) => handleEditorChange(dto)}
                          onSave={(dto) => handleEditorSave(dto)}
                        />
                      </div>
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
      />

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
    </>
  );
 }
