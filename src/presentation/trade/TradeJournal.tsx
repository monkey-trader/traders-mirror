import React, { useEffect, useState } from 'react'
import type { Trade } from '@/domain/trade/entities/Trade'
import container from '@/shared/di'
import styles from './TradeJournal.module.css'
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
  const [beMap, setBeMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    tradeService.listTrades().then(setTrades)
  }, [])

  const runMarketTick = async () => {
    if (!marketSymbol) return
    try {
      const results = await container.tradeEvaluationService.onMarketTick(marketSymbol, Number(marketPrice))
      const map: Record<string, boolean> = {}
      // build keys consistent with row keys
      for (const r of results) {
        const t = r.trade
        const key = t.symbol + '|' + (t.entryDate ?? '') + '|' + String(trades.indexOf(t))
        map[key] = r.candidate.canMoveToBreakEven
      }
      setBeMap(map)
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
    } catch (err: unknown) {
      const mapped = mapDomainErrorToFieldErrors(err)
      if (mapped.fieldErrors) {
        setFieldErrors((prev) => ({ ...prev, ...mapped.fieldErrors }))
        return
      }

      setError(mapped.message ?? (err instanceof Error ? err.message : String(err)))
    }
  }

  const filteredTrades = statusFilter === 'ALL' ? trades : trades.filter((t) => t.status === String(statusFilter))

  const handleMoveToBE = async (trade: Trade) => {
    try {
      const ev = await container.tradeEvaluationService.moveStopToBreakEven(trade)
      // refresh trades list after applying
      setTrades(await tradeService.listTrades())
    } catch (err) {
      console.error('Failed to move SL to BE', err)
    }
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
        <form onSubmit={handleAdd} className={styles.form} aria-label="Add trade form" noValidate>
          <div>
            <input
              className={styles.input}
              placeholder="Symbol"
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              aria-describedby={fieldErrors.symbol ? 'symbol-error' : undefined}
              required
            />
            {fieldErrors.symbol && (
              <div id="symbol-error" role="alert" className={styles.fieldError}>{fieldErrors.symbol}</div>
            )}
          </div>

          <div>
            <input
              className={styles.input}
              type="datetime-local"
              value={form.entryDate}
              onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
              aria-describedby={fieldErrors.entryDate ? 'entryDate-error' : undefined}
              required
            />
            {fieldErrors.entryDate && (
              <div id="entryDate-error" role="alert" className={styles.fieldError}>{fieldErrors.entryDate}</div>
            )}
          </div>

          <div>
            <input
              className={styles.input}
              type="number"
              placeholder="Size"
              value={String(form.size)}
              onChange={(e) => setForm({ ...form, size: Number(e.target.value) })}
              aria-describedby={fieldErrors.size ? 'size-error' : undefined}
              required
            />
            {fieldErrors.size && (
              <div id="size-error" role="alert" className={styles.fieldError}>{fieldErrors.size}</div>
            )}
          </div>

          <div>
            <input
              className={styles.input}
              type="number"
              placeholder="Price"
              value={String(form.price)}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              aria-describedby={fieldErrors.price ? 'price-error' : undefined}
              required
            />
            {fieldErrors.price && (
              <div id="price-error" role="alert" className={styles.fieldError}>{fieldErrors.price}</div>
            )}
          </div>

          <div>
            <input
              className={styles.input}
              type="number"
              placeholder="Stop Loss"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
            />
          </div>

          <div>
            <input
              className={styles.input}
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <button className={styles.button} type="submit">Add Trade</button>
        </form>

        {error && <div role="alert" className={styles.error} style={{ marginBottom: 12 }}>{error}</div>}

        <div className={styles.controls}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input placeholder="Market Symbol" value={marketSymbol} onChange={e => setMarketSymbol(e.target.value)} className={styles.input} />
            <input placeholder="Market Price" type="number" value={String(marketPrice)} onChange={e => setMarketPrice(Number(e.target.value))} className={styles.input} />
            <button onClick={runMarketTick} className={styles.button}>Run Market Tick</button>
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
                  const key = t.symbol + '|' + (t.entryDate ?? '') + '|' + String(i)
                  const isBe = Boolean(beMap[key])
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
                          <button onClick={() => handleMoveToBE(t)} className={styles.button} disabled={!isBe} title={isBe ? 'Move stop to Break-Even' : 'BE not available'}>Move SL → BE</button>
                          {isBe && <span className={styles.badge} data-testid={`be-badge-${i}`}>BE Available</span>}
                        </div>
                      </td>
                   </tr>
                 )
               })
             )}
           </tbody>
         </table>
       </div>
     </section>
   </div>
 )
}
