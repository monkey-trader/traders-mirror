import React, { useState, useRef, useEffect } from 'react'
import { Layout } from '@/presentation/shared/components/Layout/Layout'
import { Card } from '@/presentation/shared/components/Card/Card'
import { Button } from '@/presentation/shared/components/Button/Button'
import { Input } from '@/presentation/shared/components/Input/Input'
import { SideSelect, SideBadge, SideValue } from '@/presentation/shared/components/SideSelect/SideSelect'
import { StatusSelect } from '@/presentation/shared/components/StatusSelect/StatusSelect'
import { StatusBadge } from '@/presentation/shared/components/StatusBadge/StatusBadge'
import styles from './TradeJournal.module.css'
import InMemoryTradeRepository from '@/infrastructure/trade/repositories/InMemoryTradeRepository'

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
  const [editFields, setEditFields] = useState<{ [tradeId: string]: Partial<Record<keyof TradeRow, boolean>> }>({})
  // keep ids pinned temporarily after status change so they don't vanish immediately from open list
  const [pinnedStatusIds, setPinnedStatusIds] = useState<Set<string>>(new Set())
  const pinnedTimers = useRef<Map<string, number>>(new Map())

  // Handlers for editing fields (restored)
  const handleEditFieldClick = (tradeId: string, key: keyof TradeRow) => {
    // open edit mode for field
    setEditFields(prev => ({
      ...prev,
      [tradeId]: { ...prev[tradeId], [key]: true }
    }))
  }
  const handleEditFieldBlur = (tradeId: string, key: keyof TradeRow, value: any) => {
    // handle blur/update
    // if status changed and filter would remove the row immediately, pin it briefly so the user sees the change
    if (key === 'status') {
      // optimistic update locally and persist using the new state (avoid stale closure)
      setPositions(prev => {
        const next = prev.map(row => row.id === tradeId ? { ...row, [key]: value } : row)
        const updated = next.find(r => r.id === tradeId)
        if (updated) {
          ;(async () => {
            try {
              await repoRef.current.update(updated as any)
            } catch (err) {
              console.error('Failed to persist status update', err)
            }
          })()
        }
        return next
      })

      // if new status is not OPEN, pin for 2s so the row doesn't disappear instantly
      if (value !== 'OPEN') {
        setPinnedStatusIds(prev => {
          const next = new Set(prev)
          next.add(tradeId)
          return next
        })
        // clear any existing timer
        const existing = pinnedTimers.current.get(tradeId)
        if (existing) window.clearTimeout(existing)
        const id = window.setTimeout(() => {
          setPinnedStatusIds(prev => {
            const next = new Set(prev)
            next.delete(tradeId)
            return next
          })
          pinnedTimers.current.delete(tradeId)
        }, 2000)
        pinnedTimers.current.set(tradeId, id)
      }

      setEditFields(prev => ({
        ...prev,
        [tradeId]: { ...prev[tradeId], [key]: false }
      }))
      return
    }

    setEditFields(prev => ({
      ...prev,
      [tradeId]: { ...prev[tradeId], [key]: false }
    }))
    // optimistic update and persist using the new state to avoid stale reads
    setPositions(prev => {
      const next = prev.map(row => (row.id === tradeId ? { ...row, [key]: value } : row))
      const updated = next.find(r => r.id === tradeId)
      if (updated) {
        ;(async () => {
          try {
            await repoRef.current.update(updated as any)
          } catch (err) {
            console.error('Failed to persist update', err)
          }
        })()
      }
      return next
    })
  }

  // Für Positions: nur offene Trades des aktuellen Marktes
  const openPositions = (() => {
    // keep trades visible while their status field is being edited so the row doesn't vanish mid-edit
    // and also keep pinned ids visible for a short time after status changes
    return positions.filter(t => {
      const isOpenForFilter = t.status === 'OPEN' && (marketFilter === 'All' || t.market === marketFilter)
      const beingEdited = !!(editFields[t.id]?.status)
      const pinned = pinnedStatusIds.has(t.id)
      return isOpenForFilter || beingEdited || pinned
    })
  })()

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

  // State für expandierte Positionen
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set())
  const togglePositionExpand = (id: string) => {
    setExpandedPositions(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Handler für Demo-Management-Optionen
  const handleSetSLtoBE = (trade: TradeRow) => {
    alert(`SL für ${trade.symbol} auf Break Even (${trade.entry}) gesetzt und Status auf SL-HIT gesetzt (Demo)`)
    // TODO: State-Update/Backend-Call: SL setzen und Status auf SL-HIT
  }
  const handleSetSLHit = (trade: TradeRow) => {
    alert(`Status für ${trade.symbol} auf SL-HIT gesetzt (Demo)`)
    // TODO: State-Update/Backend-Call: Status auf SL-HIT setzen
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
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Position</th>
                  <th>Entry</th>
                  <th>SL</th>
                  <th>Margin</th>
                  <th>Leverage</th>
                  <th>P&L</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {openPositions.map(t => {
                  const isExpanded = expandedPositions.has(t.id)
                  return (
                    <React.Fragment key={t.id}>
                      <tr className={styles.mainRow}>
                        <td className={styles.chevCell}>
                          <span
                            className={styles.chev}
                            style={{ cursor: 'pointer' }}
                            onClick={() => togglePositionExpand(t.id)}
                          >
                            {isExpanded ? '▾' : '▸'}
                          </span>
                        </td>
                        {/* Symbol */}
                        <td className={styles.symbolCell}>
                          {editFields[t.id]?.symbol ? (
                            <input
                              className={styles.input}
                              type="text"
                              autoFocus
                              defaultValue={t.symbol}
                              onBlur={e => handleEditFieldBlur(t.id, 'symbol', e.target.value)}
                            />
                          ) : (
                            <span
                              className={styles.symbol}
                              tabIndex={0}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleEditFieldClick(t.id, 'symbol')}
                            >
                              {t.symbol}
                            </span>
                          )}
                        </td>
                        {/* Side */}
                        <td>
                          {editFields[t.id]?.side ? (
                            <SideSelect
                              value={t.side}
                              onChange={(v) => setPositions(prev => prev.map(row => row.id === t.id ? { ...row, side: v } : row))}
                              ariaLabel={`Edit side for ${t.symbol}`}
                              showBadge={false}
                              compact
                              colored
                              onBlur={() => setEditFields(prev => ({ ...prev, [t.id]: { ...prev[t.id], side: false } }))}
                            />
                          ) : (
                            <SideBadge
                              value={t.side}
                              className={styles.sideBadge}
                              onClick={() => handleEditFieldClick(t.id, 'side')}
                            />
                          )}
                        </td>
                        {/* Size */}
                        <td>
                          {editFields[t.id]?.size ? (
                            <input
                              className={styles.input}
                              type="number"
                              autoFocus
                              defaultValue={t.size}
                              onBlur={e => handleEditFieldBlur(t.id, 'size', Number(e.target.value))}
                            />
                          ) : (
                            <span
                              tabIndex={0}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleEditFieldClick(t.id, 'size')}
                            >
                              {t.size}
                            </span>
                          )}
                        </td>
                        {/* Entry */}
                        <td>
                          {editFields[t.id]?.entry ? (
                            <input
                              className={styles.input}
                              type="text"
                              autoFocus
                              defaultValue={t.entry ?? ''}
                              onBlur={e => handleEditFieldBlur(t.id, 'entry', e.target.value)}
                            />
                          ) : (
                            <span
                              tabIndex={0}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleEditFieldClick(t.id, 'entry')}
                            >
                              {t.entry ?? '-'}
                            </span>
                          )}
                        </td>
                        {/* SL */}
                        <td>
                          {editFields[t.id]?.sl ? (
                            <input
                              className={styles.input}
                              type="text"
                              autoFocus
                              defaultValue={t.sl ?? ''}
                              onBlur={e => handleEditFieldBlur(t.id, 'sl', e.target.value)}
                            />
                          ) : (
                            <span
                              tabIndex={0}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleEditFieldClick(t.id, 'sl')}
                            >
                              {t.sl ?? '-'}
                            </span>
                          )}
                        </td>
                        {/* Margin */}
                        <td>
                          {editFields[t.id]?.margin ? (
                            <input
                              className={styles.input}
                              type="text"
                              autoFocus
                              defaultValue={t.margin ?? ''}
                              onBlur={e => handleEditFieldBlur(t.id, 'margin', e.target.value)}
                            />
                          ) : (
                            <span
                              tabIndex={0}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleEditFieldClick(t.id, 'margin')}
                            >
                              {t.margin ?? '-'}
                            </span>
                          )}
                        </td>
                        {/* Leverage */}
                        <td>
                          {editFields[t.id]?.leverage ? (
                            <input
                              className={styles.input}
                              type="text"
                              autoFocus
                              defaultValue={t.leverage ?? ''}
                              onBlur={e => handleEditFieldBlur(t.id, 'leverage', e.target.value)}
                            />
                          ) : (
                            <span
                              tabIndex={0}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleEditFieldClick(t.id, 'leverage')}
                            >
                              {t.leverage ?? '-'}
                            </span>
                          )}
                        </td>
                        {/* P&L */}
                        <td>
                          <span className={t.pnl >= 0 ? styles.plPositive : styles.plNegative}>{t.pnl.toFixed(2)}</span>
                        </td>
                        {/* Status */}
                        <td>
                          {editFields[t.id]?.status ? (
                            <StatusSelect
                              value={t.status}
                              onChange={(v) => handleEditFieldBlur(t.id, 'status', v)}
                              ariaLabel={`Edit status for ${t.symbol}`}
                              compact
                              colored
                              onBlur={() => setEditFields(prev => ({ ...prev, [t.id]: { ...prev[t.id], status: false } }))}
                            />
                          ) : (
                            <StatusBadge
                              value={t.status}
                              className={styles.statusBadge}
                              onClick={() => handleEditFieldClick(t.id, 'status')}
                            />
                          )}
                        </td>
                        {/* Actions */}
                        <td>
                          <button className={styles.slBeBtn} onClick={() => handleSetSLtoBE(t)}>
                            SL-BE
                          </button>
                          <button className={styles.slHitBtn} onClick={() => handleSetSLHit(t)}>
                            SL-HIT
                          </button>
                          <button
                            className={styles.analysisBadgeBtn}
                            type="button"
                            onClick={() => handleAnalyseClick(t.symbol)}
                          >
                            Analyse
                          </button>
                        </td>
                      </tr>
                      {/* Expandierte Zeilen: TP1, TP2, TP3, Notes editierbar */}
                      {isExpanded && (
                        <>
                          <tr className={styles.secondaryRow}>
                            <td colSpan={11}>
                              <div className={styles.positionExpandGrid}>
                                <label>
                                  TP1:
                                  {editFields[t.id]?.tp1 ? (
                                    <input
                                      className={styles.tpInput}
                                      type="text"
                                      autoFocus
                                      defaultValue={t.tp1 ?? ''}
                                      onBlur={e => handleEditFieldBlur(t.id, 'tp1', e.target.value)}
                                    />
                                  ) : (
                                    <span
                                      className={styles.tpInput}
                                      tabIndex={0}
                                      style={{ cursor: 'pointer', display: 'inline-block' }}
                                      onClick={() => handleEditFieldClick(t.id, 'tp1')}
                                    >
                                      {t.tp1 ?? '-'}
                                    </span>
                                  )}
                                </label>
                                <label>
                                  TP2:
                                  {editFields[t.id]?.tp2 ? (
                                    <input
                                      className={styles.tpInput}
                                      type="text"
                                      autoFocus
                                      defaultValue={t.tp2 ?? ''}
                                      onBlur={e => handleEditFieldBlur(t.id, 'tp2', e.target.value)}
                                    />
                                  ) : (
                                    <span
                                      className={styles.tpInput}
                                      tabIndex={0}
                                      style={{ cursor: 'pointer', display: 'inline-block' }}
                                      onClick={() => handleEditFieldClick(t.id, 'tp2')}
                                    >
                                      {t.tp2 ?? '-'}
                                    </span>
                                  )}
                                </label>
                                <label>
                                  TP3:
                                  {editFields[t.id]?.tp3 ? (
                                    <input
                                      className={styles.tpInput}
                                      type="text"
                                      autoFocus
                                      defaultValue={t.tp3 ?? ''}
                                      onBlur={e => handleEditFieldBlur(t.id, 'tp3', e.target.value)}
                                    />
                                  ) : (
                                    <span
                                      className={styles.tpInput}
                                      tabIndex={0}
                                      style={{ cursor: 'pointer', display: 'inline-block' }}
                                      onClick={() => handleEditFieldClick(t.id, 'tp3')}
                                    >
                                      {t.tp3 ?? '-'}
                                    </span>
                                  )}
                                </label>
                              </div>
                            </td>
                          </tr>
                          <tr className={styles.secondaryRow}>
                            <td colSpan={11}>
                              <div className={styles.secondaryNotesRow}>
                                <strong>Notes:</strong>{' '}
                                {editFields[t.id]?.notes ? (
                                  <input
                                    className={styles.input}
                                    type="text"
                                    autoFocus
                                    defaultValue={t.notes ?? ''}
                                    onBlur={e => handleEditFieldBlur(t.id, 'notes', e.target.value)}
                                  />
                                ) : (
                                  <span
                                    tabIndex={0}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleEditFieldClick(t.id, 'notes')}
                                  >
                                    {t.notes ?? '-'}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        </>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
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
    </Layout>
  )
}
