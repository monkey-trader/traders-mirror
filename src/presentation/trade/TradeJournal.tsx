import React, { useEffect, useState } from 'react'
import type { Trade } from '@/domain/trade/entities/Trade'
import container from '@/shared/di'
import styles from './TradeJournal.module.css'

const tradeService = container.tradeService

export function TradeJournal() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [form, setForm] = useState({ symbol: '', entryDate: '', size: 0, price: 0, notes: '' })

  useEffect(() => {
    tradeService.listTrades().then(setTrades)
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    await tradeService.addTrade(form.symbol, form.entryDate, Number(form.size), Number(form.price), form.notes)
    setForm({ symbol: '', entryDate: '', size: 0, price: 0, notes: '' })
    setTrades(await tradeService.listTrades())
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
        <form onSubmit={handleAdd} className={styles.form} aria-label="Add trade form">
          <input
            className={styles.input}
            placeholder="Symbol"
            value={form.symbol}
            onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            required
          />
          <input
            className={styles.input}
            type="datetime-local"
            value={form.entryDate}
            onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
            required
          />
          <input
            className={styles.input}
            type="number"
            placeholder="Size"
            value={String(form.size)}
            onChange={(e) => setForm({ ...form, size: Number(e.target.value) })}
            required
          />
          <input
            className={styles.input}
            type="number"
            placeholder="Price"
            value={String(form.price)}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            required
          />
          <input
            className={styles.input}
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <button className={styles.button} type="submit">Add Trade</button>
        </form>

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
