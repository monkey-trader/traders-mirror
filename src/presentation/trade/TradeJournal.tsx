import React, { useEffect, useState } from 'react'
import type { Trade } from '@/domain/trade/entities/Trade'
import container from '@/shared/di'
import styles from './TradeJournal.module.css'
import FieldInput from '@/presentation/shared/components/FieldInput'
import { useToast } from '@/presentation/shared/Toast'
import type { FormState, FormErrors } from './validation'
import { validateAll } from './validation'
import { mapDomainErrorToFieldErrors } from './errorMapper'

const tradeService = container.tradeService

export function TradeJournal() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [form, setForm] = useState<FormState>({ symbol: '', entryDate: '', size: 0, price: 0, notes: '' })
  const [stopLoss, setStopLoss] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [statusFilter, setStatusFilter] = useState<'ALL' | string>('ALL')
  const [marketSymbol, setMarketSymbol] = useState<string>('')
  const [marketPrice, setMarketPrice] = useState<number>(0)
  const [beMap, setBeMap] = useState<Record<string, { canMoveToBreakEven: boolean; beThreshold?: number; stopTarget?: any }>>({})
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [confirmTrade, setConfirmTrade] = useState<Trade | null>(null)
  const [lastTick, setLastTick] = useState<{ symbol: string; price: number; at: string } | null>(null)
  const { showToast, ToastElement } = useToast()

  useEffect(() => {
    tradeService.listTrades().then(setTrades)
  }, [])

  const runMarketTick = async () => {
    if (!marketSymbol) return
    try {
      const results = await container.tradeEvaluationService.onMarketTick(marketSymbol, Number(marketPrice))
      setLastTick({ symbol: marketSymbol, price: Number(marketPrice), at: new Date().toISOString() })
      const map: Record<string, { canMoveToBreakEven: boolean; beThreshold?: number; stopTarget?: any }> = {}
      // build keys consistent with row keys
      for (const r of results) {
        const t = r.trade
        // deterministic composite key: symbol|entryDate|size|price
        const key = `${t.symbol}|${t.entryDate ?? ''}|${t.size}|${t.price}`
        map[key] = { canMoveToBreakEven: r.candidate.canMoveToBreakEven, beThreshold: r.candidate.beThreshold, stopTarget: r.candidate.stopTarget }
      }
      setBeMap(map)
    } catch (err) {
      console.error('Market tick failed', err)
    }
  }

  // Helper to run market tick for a given symbol and price programmatically
  const runMarketTickFor = async (symbol: string, price: number, autoOpenConfirm = true) => {
    setMarketSymbol(symbol)
    setMarketPrice(price)
    setLastTick({ symbol, price: Number(price), at: new Date().toISOString() })
    try {
      const results = await container.tradeEvaluationService.onMarketTick(symbol, Number(price))
      const map: Record<string, { canMoveToBreakEven: boolean; beThreshold?: number; stopTarget?: any }> = {}
      for (const r of results) {
        const t = r.trade
        const key = `${t.symbol}|${t.entryDate ?? ''}|${t.size}|${t.price}`
        map[key] = { canMoveToBreakEven: r.candidate.canMoveToBreakEven, beThreshold: r.candidate.beThreshold, stopTarget: r.candidate.stopTarget }
      }
      setBeMap(map)
      // If autoOpenConfirm and a candidate for the provided symbol/price is available, open confirmation
      if (autoOpenConfirm) {
        // find the first trade in results that can move
        const found = results.find((r) => r.candidate.canMoveToBreakEven)
        if (found) {
          setConfirmTrade(found.trade)
          setShowConfirm(true)
        }
      }
    } catch (err) {
      console.error('Market tick failed', err)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const errors = validateAll(form)
    setFieldErrors(errors)

    const hasError = Object.values(errors).some(Boolean)
    if (hasError) return

    try {
      const targets = [] as any[]
      if (stopLoss && Number(stopLoss) > 0) {
        targets.push({ kind: 'STOP_LOSS', price: Number(stopLoss) })
      }
      await tradeService.addTrade(form.symbol, form.entryDate, Number(form.size), Number(form.price), form.notes, undefined, targets.length ? targets : undefined)
      setForm({ symbol: '', entryDate: '', size: 0, price: 0, notes: '' })
      setStopLoss('')
      setFieldErrors({})
      setTrades(await tradeService.listTrades())
      // auto-run market tick for new trade if marketSymbol and marketPrice are set
      if (marketSymbol && marketPrice && marketSymbol === form.symbol) {
        // run tick to see quickly if BE is available for the newly created trade
        await runMarketTickFor(marketSymbol, marketPrice, false)
      }
      showToast('Trade added', 'success')
    } catch (err: unknown) {
      const mapped = mapDomainErrorToFieldErrors(err)
      if (mapped.fieldErrors) {
        setFieldErrors((prev) => ({ ...prev, ...mapped.fieldErrors }))
        return
      }

      const msg = mapped.message ?? (err instanceof Error ? err.message : String(err))
      setError(msg)
      showToast(String(msg), 'error')
    }
  }

  const filteredTrades = statusFilter === 'ALL' ? trades : trades.filter((t) => t.status === String(statusFilter))

  const handleMoveToBE = async (trade: Trade) => {
    try {
      const ev = await container.tradeEvaluationService.moveStopToBreakEven(trade)
      // refresh trades list after applying
      setTrades(await tradeService.listTrades())
      setShowConfirm(false)
      setConfirmTrade(null)
      if (ev) showToast('Stop moved to Break-Even', 'success')
    } catch (err) {
      console.error('Failed to move SL to BE', err)
      showToast('Failed to move SL to BE', 'error')
    }
  }

  const openConfirmForTrade = (trade: Trade) => {
    setConfirmTrade(trade)
    setShowConfirm(true)
  }

  const cancelConfirm = () => {
    setShowConfirm(false)
    setConfirmTrade(null)
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Trading Journal</h2>
          <div className={styles.subtitle}>See your trades. See yourself.</div>
        </div>
      </header>

      <section className={styles.card}>
        <div className={styles.formHeaderNote} title="Stop Loss can be moved to BE by user action; BE counts as a win in summary by default">Tip: Stop Loss can later be moved to Break-Even (BE) via the UI.</div>
        <form onSubmit={handleAdd} className={styles.form} aria-label="Add trade form" noValidate>
          <div className={styles.formGrid}>
            <div>
              <FieldInput id="symbol-input" label="Symbol" title="Symbol: enter the trade symbol, e.g. AAPL" placeholder="Symbol" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} aria-describedby={fieldErrors.symbol ? 'symbol-error' : undefined} required />
              {fieldErrors.symbol && (
                <div id="symbol-error" role="alert" className={styles.fieldError}>{fieldErrors.symbol}</div>
              )}
            </div>

            <div>
              <FieldInput id="entry-input" label="Entry Date" type="datetime-local" title="Entry date/time of the trade (local)" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} aria-describedby={fieldErrors.entryDate ? 'entryDate-error' : undefined} required />
              {fieldErrors.entryDate && (
                <div id="entryDate-error" role="alert" className={styles.fieldError}>{fieldErrors.entryDate}</div>
              )}
            </div>

            <div>
              <FieldInput id="size-input" label="Size" type="number" title="Position size / quantity (positive number)" placeholder="Size" value={String(form.size)} onChange={(e) => setForm({ ...form, size: Number(e.target.value) })} aria-describedby={fieldErrors.size ? 'size-error' : undefined} required />
              {fieldErrors.size && (
                <div id="size-error" role="alert" className={styles.fieldError}>{fieldErrors.size}</div>
              )}
            </div>

            <div>
              <FieldInput id="price-input" label="Price" type="number" title="Entry price for the trade" placeholder="Price" value={String(form.price)} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} aria-describedby={fieldErrors.price ? 'price-error' : undefined} required />
              {fieldErrors.price && (
                <div id="price-error" role="alert" className={styles.fieldError}>{fieldErrors.price}</div>
              )}
            </div>

            <div>
              <FieldInput id="stop-input" label="Stop Loss" type="number" title="Initial Stop Loss price (optional). Can be set above or below entry depending on strategy." placeholder="Stop Loss" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
            </div>

            <div>
              <FieldInput id="notes-input" label="Notes" title="Optional notes about the trade" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>

          <button className={styles.button} type="submit">Add Trade</button>
        </form>

        {error && <div role="alert" className={styles.error} style={{ marginBottom: 12 }}>{error}</div>}

        <div className={styles.controls}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input title="Symbol to run market tick for" placeholder="Market Symbol" value={marketSymbol} onChange={e => setMarketSymbol(e.target.value)} className={styles.input} />
            <input title="Current market price to evaluate against targets" placeholder="Market Price" type="number" value={String(marketPrice)} onChange={e => setMarketPrice(Number(e.target.value))} className={styles.input} />
            <button onClick={runMarketTick} className={styles.button}>Run Market Tick</button>
            {lastTick && (
              <div className={styles.lastTick}>Last tick: {lastTick.symbol} @ {lastTick.price} ({new Date(lastTick.at).toLocaleTimeString()})</div>
            )}
          </div>
          <select
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value as 'ALL' | string)}
             className={styles.select}
             aria-label="Filter by status"
           >
            <option value="ALL">ALL</option>
            <option value="OPEN">OPEN</option>
            <option value="PENDING">PENDING</option>
            <option value="FILLED">FILLED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Entry Date</th>
                <th>Size</th>
                <th>Price</th>
                <th>Notes</th>
                <th>Status</th>
                <th>Targets</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.length === 0 ? (
                <tr>
                  <td className={styles.empty} colSpan={7}>No trades yet. Add your first trade above.</td>
                </tr>
              ) : (
                filteredTrades.map((t, i) => {
                  const key = `${t.symbol}|${t.entryDate ?? ''}|${t.size}|${t.price}`
                  const beInfo = beMap[key]
                  const isBe = Boolean(beInfo?.canMoveToBreakEven)
                  return (
                    <tr key={i}>
                      <td>{t.symbol}</td>
                      <td>{t.entryDate}</td>
                      <td>{t.size}</td>
                      <td>{t.price}</td>
                      <td>{t.notes}</td>
                      <td>{t.status}</td>
                      <td>
                        {/* Targets summary */}
                        {t.targets && t.targets.length > 0 ? (
                          <div className={styles.targets}>
                            {t.targets.map((tg: any, idx: number) => (
                              <div key={tg.id ?? idx} className={styles.targetItem}>{tg.kind}{tg.rank ? ` ${tg.rank}` : ''}: {tg.price}</div>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.targetItem}>—</div>
                        )}
                        <div style={{ marginTop: 6 }}>
                          <button onClick={() => openConfirmForTrade(t)} className={styles.button} disabled={!isBe} title={isBe ? 'Move stop to Break-Even' : 'BE not available'}>Move SL → BE</button>
                          {beInfo && (
                            <span className={styles.badge} data-testid={`be-badge-${i}`} title={beInfo.beThreshold ? `BE threshold: ${beInfo.beThreshold}` : undefined}>
                              {beInfo.canMoveToBreakEven ? 'BE Available' : 'BE: ' + (typeof beInfo.beThreshold === 'number' ? Number(beInfo.beThreshold).toLocaleString() : '—')}
                            </span>
                          )}
                          {/* Quick helper: set market inputs to this trade's threshold and run tick */}
                          {beInfo?.beThreshold && (
                            <button className={styles.smallButton} onClick={async () => { await runMarketTickFor(t.symbol, beInfo.beThreshold!, true) }} style={{ marginLeft: 8 }}>Use BE threshold</button>
                          )}
                        </div>
                       </td>
                    </tr>
                  )
                })
             )}
           </tbody>
         </table>
       </div>
       {ToastElement}

       {/* Confirmation modal for Move SL -> BE */}
       {showConfirm && confirmTrade && (
         <div className={styles.modalOverlay} role="dialog" aria-modal="true">
           <div className={styles.modal}>
             <h3>Move Stop to Break-Even?</h3>
             <p>Trade {confirmTrade!.symbol} at {confirmTrade!.entryDate} — this will set the stop price to entry price.</p>
             <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
               <button className={styles.button} onClick={() => handleMoveToBE(confirmTrade!)}>Confirm</button>
               <button className={styles.button} onClick={cancelConfirm}>Cancel</button>
             </div>
           </div>
         </div>
       )}
     </section>
   </div>
 )
 }
