import React, { useState, useRef, useEffect } from 'react'
// Layout is provided by App; do not render Layout again here to avoid duplicate headers
import { Card } from '@/presentation/shared/components/Card/Card'
import { Button } from '@/presentation/shared/components/Button/Button'
import { Input } from '@/presentation/shared/components/Input/Input'
import { SideSelect, SideValue } from '@/presentation/shared/components/SideSelect/SideSelect'
import styles from './TradeJournal.module.css'
import InMemoryTradeRepository from '@/infrastructure/trade/repositories/InMemoryTradeRepository'
import { ConfirmDialog } from '@/presentation/shared/components/ConfirmDialog/ConfirmDialog'
import { TradeList } from './TradeList/TradeList'
import { TradeDetailEditor } from './TradeDetail/TradeDetailEditor'

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
  sl?: string
  tp1?: string
  tp2?: string
  tp3?: string
  margin?: string
  leverage?: string
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

  // track dirty ids (simple set of ids with local unsaved changes)
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set())

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

  // Trades nach Markt filtern (berechnet aus editable positions)
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
    try {
      const existing = positions.find(p => p.id === dto.id)
      if (!existing) throw new Error('Trade not found')
      const updated = { ...existing, symbol: dto.symbol, entryDate: dto.entryDate, size: dto.size, price: dto.price, side: dto.side as 'LONG' | 'SHORT', notes: dto.notes }
      await repoRef.current.update(updated as any)
      setPositions(prev => prev.map(p => (p.id === dto.id ? updated : p)))
      setDirtyIds(prev => {
        const next = new Set(prev)
        next.delete(dto.id)
        return next
      })
    } catch (err) {
      console.error('Save failed', err)
      throw err
    }
  }

  // Handler für das Hinzufügen eines neuen Trades
  const [form, setForm] = useState({
    symbol: '',
    entryDate: '',
    size: 0,
    price: 0,
    side: 'LONG' as SideValue,
    notes: ''
  })


  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const newTrade: TradeRow = {
      id: crypto.randomUUID(),
      symbol: form.symbol,
      entryDate: form.entryDate,
      size: Number(form.size),
      price: Number(form.price),
      side: form.side as 'LONG' | 'SHORT',
      notes: form.notes,
      market: "Crypto",
      status: 'OPEN',
      pnl: 0,
    }
    setPositions(prev => [newTrade, ...prev])
    setForm({ symbol: '', entryDate: '', size: 0, price: 0, side: 'LONG', notes: '' })
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
      updateTradeById(id, { sl: prev.entry ?? prev.sl, status: 'CLOSED' })
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

  return (
    <>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Trading Journal - Demo</h2>
        <div className={styles.controls}>
          <div className={styles.filterPills}>
            <Button
              variant={marketFilter === 'Crypto' ? 'primary' : 'ghost'}
              onClick={() => setMarketFilter('Crypto')}
            >
              Crypto
            </Button>
            <Button
              variant={marketFilter === 'Forex' ? 'primary' : 'ghost'}
              onClick={() => setMarketFilter('Forex')}
            >
              Forex
            </Button>
            <Button
              variant={marketFilter === 'All' ? 'primary' : 'ghost'}
              onClick={() => setMarketFilter('All')}
            >
              All
            </Button>
          </div>
        </div>
      </div>

      {/* containerRef wraps the grid so we can detect available width */}
      <div ref={containerRef} className={compactGrid ? `${styles.grid} ${styles.gridCompact} ${styles.fullScreen}` : `${styles.grid} ${styles.fullScreen}`}>
         <div className={styles.left}>
          <Card title="New Trade">
            <form className={styles.form} onSubmit={handleAdd}>
              <div className={styles.row}>
                <Input label="Symbol" placeholder="e.g. AAPL" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} />
                <Input label="Entry Date" type="datetime-local" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} />
              </div>

              <div className={styles.row}>
                <Input label="Size" type="number" value={String(form.size)} onChange={(e) => setForm({ ...form, size: Number(e.target.value) })} />
                <Input label="Price" type="number" value={String(form.price)} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>

              <div className={styles.row}>
                <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div className={styles.row}>
                <label className={styles.label} htmlFor="side">Side</label>
                <SideSelect
                  value={form.side as SideValue}
                  onChange={(v) => setForm({ ...form, side: v })}
                  ariaLabel="New trade side"
                  showBadge={false}
                  colored
                />
              </div>

              <div className={styles.actions}>
                <Button variant="primary">Add Trade</Button>
                <Button variant="ghost">Reset</Button>
              </div>
            </form>
          </Card>
         </div>

         <div className={styles.right}>
            <Card title={`Trades`}>
              <div className={styles.marketHeader}>{marketFilter}   {trades.length} trades</div>
              <div className={styles.controls} style={{ marginBottom: 8 }}>
                <Button variant={tradeStatusFilter === 'ALL' ? 'primary' : 'ghost'} onClick={() => setTradeStatusFilter('ALL')}>All</Button>
                <Button variant={tradeStatusFilter === 'OPEN' ? 'primary' : 'ghost'} onClick={() => setTradeStatusFilter('OPEN')}>Open</Button>
                <Button variant={tradeStatusFilter === 'CLOSED' ? 'primary' : 'ghost'} onClick={() => setTradeStatusFilter('CLOSED')}>Closed</Button>
                <Button variant={tradeStatusFilter === 'FILLED' ? 'primary' : 'ghost'} onClick={() => setTradeStatusFilter('FILLED')}>Filled</Button>
              </div>
             <div className={styles.listAndDetailWrap}>
               <div className={styles.leftPane}>
                 <TradeList trades={trades} selectedId={selectedId} dirtyIds={dirtyIds} onSelect={(id) => setSelectedId(id)} />
               </div>

               <div className={styles.rightPane}>
                 <TradeDetailEditor
                   trade={(() => {
                     const p = positions.find(p => p.id === selectedId)
                     return p ? { id: p.id, symbol: p.symbol, entryDate: p.entryDate, size: p.size, price: p.price, side: p.side, notes: p.notes } : null
                   })()}
                   onChange={(dto) => handleEditorChange(dto)}
                   onSave={(dto) => handleEditorSave(dto)}
                 />
               </div>
              </div>
            </Card>
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
             <Button variant="ghost" onClick={handleUndo}>Rückgängig</Button>
           </div>
         </div>
       )}
    </>
  )
 }
