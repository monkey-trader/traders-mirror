import React, { useEffect, useState, useMemo } from 'react'
import type { TradeInput } from '@/domain/trade/entities/TradeFactory'
import { validateTrade } from '@/presentation/trade/validation'
import { mapTradeError } from '@/presentation/trade/errorMapper'
import styles from './TradeDetailEditor.module.css'

export type TradeDetailEditorProps = {
  trade: TradeInput | null
  onChange?: (t: TradeInput) => void
  onSave?: (t: TradeInput) => Promise<void>
}

export function TradeDetailEditor({ trade, onChange, onSave }: TradeDetailEditorProps) {
  const [local, setLocal] = useState<TradeInput | null>(trade)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle')

  useEffect(() => {
    setLocal(trade)
    setErrors({})
    setStatus('idle')
  }, [trade?.id])

  useEffect(() => {
    // notify parent immediately on change so parent can keep canonical list
    if (local && onChange) onChange(local)
  }, [local, onChange])

  const validation = useMemo(() => (local ? validateTrade(local) : {}), [local])
  const hasValidationErrors = Object.values(validation).some(Boolean)
  const isDirty = useMemo(() => {
    if (!local || !trade) return Boolean(local && !trade)
    try {
      return JSON.stringify(local) !== JSON.stringify(trade)
    } catch (_e) {
      return true
    }
  }, [local, trade])

  if (!local) return <div className={styles.empty}>No trade selected</div>

  const fieldChange = <K extends keyof TradeInput>(key: K, value: TradeInput[K]) => {
    setLocal(prev => prev ? ({ ...prev, [key]: value }) : prev)
    setStatus('idle')
  }

  const handleBlurOrSave = async () => {
    if (!local) return
    const v = validateTrade(local)
    const hasErrors = Object.values(v).some(Boolean)
    setErrors(v)
    if (hasErrors) return
    if (!onSave) return

    setStatus('saving')
    try {
      await onSave(local)
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 1200)
    } catch (err) {
      const mapped = mapTradeError(err)
      if (mapped.field) {
        const field = mapped.field
        setErrors(prev => ({ ...prev, [field]: mapped.message }))
      }
      setStatus('failed')
      throw err
    }
  }

  const saveDisabled = status === 'saving' || !isDirty || hasValidationErrors || !onSave

  return (
    <div className={styles.editor} aria-live="polite">
      <div className={styles.header}>
        <div className={styles.title}>{local.symbol} <span className={styles.sub}>#{local.id}</span></div>
        <div className={styles.saveStatus} aria-hidden={status === 'idle'}>
          {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : status === 'failed' ? 'Failed' : ''}
        </div>
      </div>

      <div className={styles.form}>
        <label className={styles.label}>Symbol</label>
        <input aria-label="Symbol" className={styles.input} value={local.symbol} onChange={(e) => fieldChange('symbol', e.target.value)} onBlur={handleBlurOrSave} />
        {errors.symbol && <div className={styles.fieldError}>{errors.symbol}</div>}

        <label className={styles.label}>Entry Date</label>
        <input aria-label="Entry Date" className={styles.input} type="datetime-local" value={local.entryDate} onChange={(e) => fieldChange('entryDate', e.target.value)} onBlur={handleBlurOrSave} />
        {errors.entryDate && <div className={styles.fieldError}>{errors.entryDate}</div>}

        <label className={styles.label}>Size</label>
        <input aria-label="Size" className={styles.input} type="number" value={local.size} onChange={(e) => fieldChange('size', Number(e.target.value))} onBlur={handleBlurOrSave} />
        {errors.size && <div className={styles.fieldError}>{errors.size}</div>}

        <label className={styles.label}>Price</label>
        <input aria-label="Price" className={styles.input} type="number" value={local.price} onChange={(e) => fieldChange('price', Number(e.target.value))} onBlur={handleBlurOrSave} />
        {errors.price && <div className={styles.fieldError}>{errors.price}</div>}

        <label className={styles.label}>Side</label>
        <select aria-label="Side" className={styles.input} value={local.side} onChange={(e) => fieldChange('side', e.target.value)} onBlur={handleBlurOrSave}>
          <option value="LONG">LONG</option>
          <option value="SHORT">SHORT</option>
        </select>
        {errors.side && <div className={styles.fieldError}>{errors.side}</div>}

        <label className={styles.label}>Notes</label>
        <textarea aria-label="Notes" className={styles.textarea} value={local.notes ?? ''} onChange={(e) => fieldChange('notes', e.target.value)} onBlur={handleBlurOrSave} />

        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            className={`${styles.saveBtn} ${status === 'saving' ? styles.savingPulse : ''}`}
            onClick={handleBlurOrSave}
            disabled={saveDisabled}
            aria-disabled={saveDisabled}
            aria-busy={status === 'saving'}
          >
            {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Save now'}
          </button>
        </div>
      </div>
    </div>
  )
}
