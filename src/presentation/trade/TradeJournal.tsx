import React, { useState, useRef, useEffect } from 'react'
import { Layout } from '@/presentation/shared/components/Layout/Layout'
import { Card } from '@/presentation/shared/components/Card/Card'
import { Button } from '@/presentation/shared/components/Button/Button'
import { Input } from '@/presentation/shared/components/Input/Input'
import { SideSelect, SideBadge, SideValue } from '@/presentation/shared/components/SideSelect/SideSelect'
import { StatusSelect } from '@/presentation/shared/components/StatusSelect/StatusSelect'
import { StatusBadge } from '@/presentation/shared/components/StatusBadge/StatusBadge'
import styles from './TradeJournal.module.css'

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

const MOCK_TRADES: TradeRow[] = [
  {
    id: 't1',
    market: 'Crypto',
    symbol: 'ETHUSD',
    entryDate: '2025-12-21T10:12:00Z',
    size: 0.51,
    price: 1800.5,
    side: 'SHORT',
    status: 'OPEN',
    pnl: 0,
    notes: 'Scalp-Short nach Fehlausbruch.',
    entry: '1802.0',
    sl: '1815.0',
    tp1: '1790.0',
    tp2: '1775.0',
    tp3: '1750.0',
    margin: '120',
    leverage: '10x',
  },
  {
    id: 't2',
    market: 'Crypto',
    symbol: 'ETHUSD',
    entryDate: '2025-12-21T09:50:00Z',
    size: 0.37,
    price: 1795.3,
    side: 'LONG',
    status: 'OPEN',
    pnl: 0,
    notes: 'Rebound nach Support.',
    entry: '1794.0',
    sl: '1790.0',
    tp1: '1805.0',
    tp2: '1820.0',
    tp3: '1850.0',
    margin: '90',
    leverage: '8x',
  },
  {
    id: 't3',
    market: 'Forex',
    symbol: 'EURUSD',
    entryDate: '2025-12-20T08:30:00Z',
    size: 10000,
    price: 1.1203,
    side: 'LONG',
    status: 'CLOSED',
    pnl: -12.5,
    notes: 'Reverted on news',
    entry: '1.1190',
    sl: '1.1170',
    tp1: '1.1250',
    tp2: '1.1280',
    tp3: '1.1300',
    margin: '100',
    leverage: '10x',
  },
  {
    id: 't4',
    market: 'Crypto',
    symbol: 'BTCUSD',
    entryDate: '2025-12-22T11:00:00Z',
    size: 0.12,
    price: 42000.0,
    side: 'LONG',
    status: 'OPEN',
    pnl: 150.5,
    notes: 'Breakout trade, trailing SL.',
    entry: '41950',
    sl: '41700',
    tp1: '42500',
    tp2: '43000',
    tp3: '44000',
    margin: '500',
    leverage: '5x',
  },
  {
    id: 't5',
    market: 'Crypto',
    symbol: 'SOLUSD',
    entryDate: '2025-12-22T10:30:00Z',
    size: 10,
    price: 95.2,
    side: 'SHORT',
    status: 'OPEN',
    pnl: -20.1,
    notes: 'Short nach Fehlausbruch.',
    entry: '96.0',
    sl: '98.0',
    tp1: '92.0',
    tp2: '89.0',
    tp3: '85.0',
    margin: '200',
    leverage: '3x',
  },
  {
    id: 't6',
    market: 'Forex',
    symbol: 'USDJPY',
    entryDate: '2025-12-22T09:45:00Z',
    size: 5000,
    price: 134.55,
    side: 'LONG',
    status: 'OPEN',
    pnl: 10.0,
    notes: 'Range-Breakout, TP1 erreicht.',
    entry: '134.20',
    sl: '133.80',
    tp1: '134.80',
    tp2: '135.20',
    tp3: '136.00',
    margin: '150',
    leverage: '20x',
  },
  {
    id: 't7',
    market: 'Crypto',
    symbol: 'ADAUSD',
    entryDate: '2025-12-22T08:10:00Z',
    size: 200,
    price: 1.25,
    side: 'LONG',
    status: 'OPEN',
    pnl: 5.5,
    notes: 'Scalp, schnelle Bewegung erwartet.',
    entry: '1.24',
    sl: '1.22',
    tp1: '1.28',
    tp2: '1.32',
    tp3: '1.36',
    margin: '50',
    leverage: '10x',
  },
  {
    id: 't8',
    market: 'Forex',
    symbol: 'GBPUSD',
    entryDate: '2025-12-22T07:30:00Z',
    size: 8000,
    price: 1.3200,
    side: 'SHORT',
    status: 'OPEN',
    pnl: -8.2,
    notes: 'News-Event, SL eng.',
    entry: '1.3210',
    sl: '1.3230',
    tp1: '1.3180',
    tp2: '1.3150',
    tp3: '1.3100',
    margin: '120',
    leverage: '15x',
  },
  {
    id: 't9',
    market: 'Crypto',
    symbol: 'XRPUSD',
    entryDate: '2025-12-22T06:50:00Z',
    size: 500,
    price: 0.95,
    side: 'LONG',
    status: 'OPEN',
    pnl: 2.1,
    notes: 'TP1 fast erreicht.',
    entry: '0.94',
    sl: '0.92',
    tp1: '0.97',
    tp2: '1.00',
    tp3: '1.05',
    margin: '30',
    leverage: '8x',
  },
  {
    id: 't10',
    market: 'Crypto',
    symbol: 'DOGEUSD',
    entryDate: '2025-12-22T06:20:00Z',
    size: 1000,
    price: 0.12,
    side: 'SHORT',
    status: 'OPEN',
    pnl: -1.5,
    notes: 'Memecoin-Short, hohes Risiko.',
    entry: '0.13',
    sl: '0.14',
    tp1: '0.11',
    tp2: '0.10',
    tp3: '0.09',
    margin: '25',
    leverage: '2x',
  },
  {
    id: 't11',
    market: 'Forex',
    symbol: 'AUDUSD',
    entryDate: '2025-12-22T05:40:00Z',
    size: 6000,
    price: 0.7550,
    side: 'LONG',
    status: 'OPEN',
    pnl: 3.3,
    notes: 'TP2 Ziel, SL nachgezogen.',
    entry: '0.7540',
    sl: '0.7520',
    tp1: '0.7570',
    tp2: '0.7600',
    tp3: '0.7650',
    margin: '80',
    leverage: '12x',
  },
  {
    id: 't12',
    market: 'Crypto',
    symbol: 'MATICUSD',
    entryDate: '2025-12-22T05:10:00Z',
    size: 300,
    price: 2.10,
    side: 'LONG',
    status: 'OPEN',
    pnl: 7.7,
    notes: 'Layer2 Hype, TP1 erreicht.',
    entry: '2.05',
    sl: '2.00',
    tp1: '2.15',
    tp2: '2.25',
    tp3: '2.40',
    margin: '60',
    leverage: '7x',
  },
  {
    id: 't13',
    market: 'Forex',
    symbol: 'USDCAD',
    entryDate: '2025-12-22T04:30:00Z',
    size: 4000,
    price: 1.2700,
    side: 'SHORT',
    status: 'OPEN',
    pnl: -4.0,
    notes: 'Korrektur-Short, TP1 offen.',
    entry: '1.2710',
    sl: '1.2730',
    tp1: '1.2680',
    tp2: '1.2650',
    tp3: '1.2600',
    margin: '70',
    leverage: '9x',
  },
]

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

  // State für Positionsdaten (editierbar)
  const [positions, setPositions] = useState<TradeRow[]>(MOCK_TRADES)

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
    setEditFields(prev => ({
      ...prev,
      [tradeId]: { ...prev[tradeId], [key]: true }
    }))
  }
  const handleEditFieldBlur = (tradeId: string, key: keyof TradeRow, value: any) => {
    // if status changed and filter would remove the row immediately, pin it briefly so the user sees the change
    if (key === 'status') {
      setPositions(prev => prev.map(row => row.id === tradeId ? { ...row, [key]: value } : row))

      // if current filter is OPEN and new status is not OPEN, pin for 2s
      if (tradeStatusFilter === 'OPEN' && value !== 'OPEN') {
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
    setPositions(prev => prev.map(row =>
      row.id === tradeId ? { ...row, [key]: value } : row
    ))
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
