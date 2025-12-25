import React, { useState, useRef, useEffect } from 'react'
import { Layout } from '@/presentation/shared/components/Layout/Layout'
import { Card } from '@/presentation/shared/components/Card/Card'
import { Button } from '@/presentation/shared/components/Button/Button'
import { Input } from '@/presentation/shared/components/Input/Input'
import { SideSelect, SideValue } from '@/presentation/shared/components/SideSelect/SideSelect'
import { StatusBadge } from '@/presentation/shared/components/StatusBadge/StatusBadge'
import styles from './TradeJournal.module.css'
import InMemoryTradeRepository from '@/infrastructure/trade/repositories/InMemoryTradeRepository'
import { PositionCard } from './components/PositionCard/PositionCard'
import { ConfirmDialog } from '@/presentation/shared/components/ConfirmDialog/ConfirmDialog'

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

// Mock dataset moved to InMemoryTradeRepository (infrastructure). Use that repo as single source of truth for demo data.

export function TradeJournal() {
  const [marketFilter, setMarketFilter] = useState<'All' | 'Crypto' | 'Forex'>('All')
  const [tradeStatusFilter, setTradeStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED' | 'FILLED'>('ALL')

  // expanded rows set
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const toggleRow = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // repository instance (in-memory for demo)
  const repoRef = useRef(new InMemoryTradeRepository())

  // State für Positionsdaten (editierbar)
  const [positions, setPositions] = useState<TradeRow[]>([])

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

  // Editierbare Felder für alle Positions-Spalten
  const [editFields] = useState<{ [tradeId: string]: Partial<Record<keyof TradeRow, boolean>> }>({})
  // keep ids pinned temporarily after status change so they don't vanish immediately from open list
  const [pinnedStatusIds] = useState<Set<string>>(new Set())

  // Note: quick action handlers use the centralized confirm/undo flow below.

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

  // Hilfsfunktion zum Öffnen der Analyse-Seite im neuen Tab
  function handleAnalyseClick(symbol: string) {
    window.open(`/analyse?symbol=${encodeURIComponent(symbol)}`, '_blank', 'noopener,noreferrer');
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

  const openConfirm = (action: 'close' | 'sl-be' | 'sl-hit' | 'toggle-side', id: string) => {
    setConfirmAction(action)
    setConfirmTradeId(id)
    setConfirmOpen(true)
  }

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

  // State and toggler for expanded position cards in the left panel
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set())
  const togglePositionExpand = (id: string) => {
    setExpandedPositions(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Open positions for the left panel: show OPEN and FILLED, but keep rows visible while editing or pinned
  const openPositions = (() => {
    return positions.filter(t => {
      const isOpenForFilter = (t.status === 'OPEN' || t.status === 'FILLED') && (marketFilter === 'All' || t.market === marketFilter)
      const beingEdited = !!(editFields[t.id]?.status)
      const pinned = pinnedStatusIds.has(t.id)
      return isOpenForFilter || beingEdited || pinned
    })
  })()

  return (
    <Layout>
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
      <div ref={containerRef} className={compactGrid ? `${styles.grid} ${styles.gridCompact}` : styles.grid}>
        <div className={styles.left}>
          <Card title="New Trade">
            <form className={styles.form} onSubmit={handleAdd}>
              <div className={styles.row}>
                <Input label="Symbol" placeholder="e.g. AAPL" />
                <Input label="Entry Date" type="datetime-local" />
              </div>

              <div className={styles.row}>
                <Input label="Size" type="number" />
                <Input label="Price" type="number" />
              </div>

              <div className={styles.row}>
                <Input label="Notes" />
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

          <Card title="Positions">
            <div className={styles.positionsList}>
              {openPositions.map(t => (
                <div key={t.id}>
                  <PositionCard
                    id={t.id}
                    symbol={t.symbol}
                    side={t.side}
                    size={t.size}
                    entry={t.entry}
                    sl={t.sl}
                    pnl={t.pnl}
                    onExpand={(id) => togglePositionExpand(id)}
                    onToggleSide={(id) => openConfirm('toggle-side', id)}
                    onSetSLtoBE={(id) => openConfirm('sl-be', id)}
                    onSetSLHit={(id) => openConfirm('sl-hit', id)}
                    onClose={(id) => openConfirm('close', id)}
                  />
                  {expandedPositions.has(t.id) && (
                    <div className={styles.positionExpandRow}>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <div><strong>Entry:</strong> {t.entry ?? '-'}</div>
                        <div><strong>SL:</strong> {t.sl ?? '-'}</div>
                        <div><strong>TP1:</strong> {t.tp1 ?? '-'}</div>
                        <div><strong>TP2:</strong> {t.tp2 ?? '-'}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
           </Card>
        </div>

        <div className={styles.right}>
          <Card title={`Trades`}>
            <div className={styles.marketHeader}>{marketFilter} — {trades.length} trades</div>
            <div className={styles.controls} style={{ marginBottom: 8 }}>
              <Button variant={tradeStatusFilter === 'ALL' ? 'primary' : 'ghost'} onClick={() => setTradeStatusFilter('ALL')}>All</Button>
              <Button variant={tradeStatusFilter === 'OPEN' ? 'primary' : 'ghost'} onClick={() => setTradeStatusFilter('OPEN')}>Open</Button>
              <Button variant={tradeStatusFilter === 'CLOSED' ? 'primary' : 'ghost'} onClick={() => setTradeStatusFilter('CLOSED')}>Closed</Button>
              <Button variant={tradeStatusFilter === 'FILLED' ? 'primary' : 'ghost'} onClick={() => setTradeStatusFilter('FILLED')}>Filled</Button>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}></th>
                    <th>Time</th>
                    <th>Symbol</th>
                    <th>Status</th>
                    <th>Side</th>
                    <th>Position</th>
                    <th>P&L</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t) => {
                    const isExpanded = expandedIds.has(t.id)
                    const mainRowClass = [styles.mainRow, styles.mainRowClickable, isExpanded ? styles.mainRowExpanded : '']
                      .filter(Boolean)
                      .join(' ')

                    return (
                      <React.Fragment key={t.id}>
                        <tr className={mainRowClass} onClick={(e) => { if ((e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'A') toggleRow(t.id) }} aria-expanded={isExpanded}>
                          <td className={styles.chevCell}><span className={styles.chev}>{isExpanded ? '▾' : '▸'}</span></td>
                          <td>{new Date(t.entryDate).toLocaleDateString()}</td>
                          <td className={styles.symbolCell}>
                            <span className={styles.symbol}>{t.symbol}</span>
                          </td>
                          <td>
                            <StatusBadge value={t.status} />
                          </td>
                          <td className={t.side === 'LONG' ? styles.sideLong : styles.sideShort}>{t.side}</td>
                          <td>{t.size}</td>
                          <td className={t.pnl >= 0 ? styles.plPositive : styles.plNegative}>{t.pnl.toFixed(2)}</td>
                          <td>
                            <button
                              className={styles.analysisBadgeBtn}
                              type="button"
                              onClick={() => handleAnalyseClick(t.symbol)}
                            >
                              Analyse
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className={styles.secondaryRow}>
                            <td colSpan={8}>
                              <div className={styles.secondaryDetailsRow}>
                                <div><strong>Entry:</strong> {t.entry ?? '-'}</div>
                                <div><strong>SL:</strong> {t.sl ?? '-'}</div>
                                <div><strong>TP1:</strong> {t.tp1 ?? '-'}</div>
                                <div><strong>TP2:</strong> {t.tp2 ?? '-'}</div>
                                <div><strong>TP3:</strong> {t.tp3 ?? '-'}</div>
                                <div><strong>Margin:</strong> {t.margin ?? '-'}</div>
                                <div><strong>Leverage:</strong> {t.leverage ?? '-'}</div>
                              </div>
                              <div className={styles.secondaryNotesRow}>
                                <strong>Notes:</strong> {t.notes ?? '-'}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
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
    </Layout>
  )
}
