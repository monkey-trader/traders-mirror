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
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})

  useEffect(() => {
    tradeService.listTrades().then(setTrades)
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const errors = validateAll(form)
    setFieldErrors(errors)

    const hasError = Object.values(errors).some(Boolean)
    if (hasError) return

    try {
      await tradeService.addTrade(form.symbol, form.entryDate, Number(form.size), Number(form.price), form.notes)
      setForm({ symbol: '', entryDate: '', size: 0, price: 0, notes: '' })
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
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <button className={styles.button} type="submit">Add Trade</button>
        </form>

        {error && <div role="alert" className={styles.error} style={{ marginBottom: 12 }}>{error}</div>}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Entry Date</th>
                <th>Size</th>
                <th>Price</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <tr>
                  <td className={styles.empty} colSpan={5}>No trades yet. Add your first trade above.</td>
                </tr>
              ) : (
                trades.map((t, i) => (
                  <tr key={i}>
                    <td>{t.symbol}</td>
                    <td>{t.entryDate}</td>
                    <td>{t.size}</td>
                    <td>{t.price}</td>
                    <td>{t.notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
