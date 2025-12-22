import React, { useEffect, useState } from 'react'
import { Trade } from '../../domain/trade/entities/Trade'
import { TradeService } from '../../application/trade/services/TradeService'
import { InMemoryTradeRepository } from '../../infrastructure/trade/repositories/InMemoryTradeRepository'
import styles from './TradeJournal.module.css'

const tradeRepository = new InMemoryTradeRepository()
const tradeService = new TradeService(tradeRepository)

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
      <h2>Trading Journal</h2>
      <form onSubmit={handleAdd} className={styles.form}>
        <input placeholder="Symbol" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} required />
        <input type="datetime-local" value={form.entryDate} onChange={e => setForm({ ...form, entryDate: e.target.value })} required />
        <input type="number" placeholder="Size" value={String(form.size)} onChange={e => setForm({ ...form, size: Number(e.target.value) })} required />
        <input type="number" placeholder="Price" value={String(form.price)} onChange={e => setForm({ ...form, price: Number(e.target.value) })} required />
        <input placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        <button type="submit">Add Trade</button>
      </form>

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
          {trades.map((t, i) => (
            <tr key={i}>
              <td>{t.symbol}</td>
              <td>{t.entryDate}</td>
              <td>{t.size}</td>
              <td>{t.price}</td>
              <td>{t.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TradeJournal
