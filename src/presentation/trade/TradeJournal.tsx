import React, { useEffect, useState } from 'react'
import type { Trade } from '@/domain/trade/entities/Trade'
import container from '@/shared/di'
import styles from './TradeJournal.module.css'
import {
  SizeNotNumberError,
  SizeMustBePositiveError,
  PriceNotNumberError,
  PriceMustBePositiveError,
  EntryDateInvalidError,
  SymbolRequiredError,
  SymbolTooLongError,
} from '@/domain/trade/errors/DomainErrors'

const tradeService = container.tradeService

type FormState = {
  symbol: string
  entryDate: string
  size: number
  price: number
  notes: string
}

type FormErrors = Partial<Record<keyof FormState, string | null>>

// Simple i18n-ready messages object (expandable)
const messages = {
  en: {
    symbolRequired: 'Symbol required',
    entryDateRequired: 'Entry date required',
    invalidDate: 'Invalid date',
    sizePositive: 'Size must be positive',
    sizeNumber: 'Size must be a number',
    pricePositive: 'Price must be positive',
    priceNumber: 'Price must be a number',
    failedAdd: 'Failed to add trade',
    symbolTooLong: 'Symbol too long',
  },
}

const locale = 'en'
const t = (key: keyof typeof messages['en']) => messages[locale][key]

export function TradeJournal() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [form, setForm] = useState<FormState>({ symbol: '', entryDate: '', size: 0, price: 0, notes: '' })
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})

  useEffect(() => {
    tradeService.listTrades().then(setTrades)
  }, [])

  const validateField = (name: keyof FormState, value: unknown): string | null => {
    // explicit if/else to avoid lexical declarations in switch case blocks
    if (name === 'symbol') {
      const v = String(value ?? '')
      if (!v || v.trim() === '') return t('symbolRequired')
      return null
    }

    if (name === 'entryDate') {
      const v = String(value ?? '')
      if (!v || v.trim() === '') return t('entryDateRequired')
      // Basic date sanity check
      const d = new Date(v)
      if (Number.isNaN(d.getTime())) return t('invalidDate')
      return null
    }

    if (name === 'size') {
      const num = Number(value)
      if (!Number.isFinite(num)) return t('sizeNumber')
      if (num <= 0) return t('sizePositive')
      return null
    }

    if (name === 'price') {
      const num = Number(value)
      if (!Number.isFinite(num)) return t('priceNumber')
      if (num <= 0) return t('pricePositive')
      return null
    }

    return null
  }

  const validateAll = (): FormErrors => {
    // Build the errors object explicitly to avoid iteration edge-cases in tests
    return {
      symbol: validateField('symbol', form.symbol),
      entryDate: validateField('entryDate', form.entryDate),
      size: validateField('size', form.size),
      price: validateField('price', form.price),
      notes: null,
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const errors = validateAll()
    setFieldErrors(errors)

    const hasError = Object.values(errors).some(Boolean)
    if (hasError) return

    try {
      await tradeService.addTrade(form.symbol, form.entryDate, Number(form.size), Number(form.price), form.notes)
      setForm({ symbol: '', entryDate: '', size: 0, price: 0, notes: '' })
      setFieldErrors({})
      setTrades(await tradeService.listTrades())
    } catch (err: unknown) {
      // Map domain error instances to specific field errors (i18n-ready)
      if (err instanceof SizeMustBePositiveError) {
        setFieldErrors((prev) => ({ ...prev, size: t('sizePositive') }))
        return
      }

      if (err instanceof SizeNotNumberError) {
        setFieldErrors((prev) => ({ ...prev, size: t('sizeNumber') }))
        return
      }

      if (err instanceof PriceMustBePositiveError) {
        setFieldErrors((prev) => ({ ...prev, price: t('pricePositive') }))
        return
      }

      if (err instanceof PriceNotNumberError) {
        setFieldErrors((prev) => ({ ...prev, price: t('priceNumber') }))
        return
      }

      if (err instanceof EntryDateInvalidError) {
        setFieldErrors((prev) => ({ ...prev, entryDate: t('invalidDate') }))
        return
      }

      if (err instanceof SymbolRequiredError) {
        setFieldErrors((prev) => ({ ...prev, symbol: t('symbolRequired') }))
        return
      }

      if (err instanceof SymbolTooLongError) {
        setFieldErrors((prev) => ({ ...prev, symbol: t('symbolTooLong') }))
        return
      }

      const message = err instanceof Error ? err.message : String(err)
      setError(message ?? t('failedAdd'))
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
