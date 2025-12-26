import React, { useEffect, useState, useMemo, useRef } from 'react'
import type { TradeInput } from '@/domain/trade/entities/TradeFactory'
import { validateTrade } from '@/presentation/trade/validation'
import { mapTradeError } from '@/presentation/trade/errorMapper'
import styles from './TradeDetailEditor.module.css'
import { Button } from '@/presentation/shared/components/Button/Button'
import { SideSelect, type SideValue } from '@/presentation/shared/components/SideSelect/SideSelect'

export type TradeDetailEditorProps = {
  trade: TradeInput | null
  onChange?: (t: TradeInput) => void
  onSave?: (t: TradeInput) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export function TradeDetailEditor({ trade, onChange, onSave, onDelete }: TradeDetailEditorProps) {
  const [local, setLocal] = useState<TradeInput | null>(trade)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle')

  useEffect(() => {
    setLocal(trade)
    setErrors({})
    setStatus('idle')
  }, [trade?.id])

  // Keep an immutable snapshot of the trade as it was when loaded into the editor.
  // This avoids a race where parent onChange updates the canonical trade object
  // and causes a JSON-equality check against `trade` to reset the dirty flag.
  const initialTradeRef = useRef<TradeInput | null>(trade ?? null)
  useEffect(() => {
    initialTradeRef.current = trade ?? null
  }, [trade?.id])

  useEffect(() => {
    // notify parent immediately on change so parent can keep canonical list
    if (local && onChange) onChange(local)
  }, [local, onChange])

  const validation = useMemo(() => (local ? validateTrade(local) : {}), [local])
  const hasValidationErrors = Object.values(validation).some(Boolean)
  const isDirty = useMemo(() => {
    if (!local) return false
    const base = initialTradeRef.current
    if (!base) return true
    try {
      return JSON.stringify(local) !== JSON.stringify(base)
    } catch (_e) {
      return true
    }
  }, [local, /* initialTradeRef is stable */ hasValidationErrors])

  if (!local) return (
    <div className={styles.empty}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Kein Trade ausgewählt</div>
      <div style={{ color: 'var(--muted)', marginBottom: 12 }}>
        Wähle einen Trade aus der Liste, um ihn hier anzusehen oder zu bearbeiten. Du kannst auch einen neuen Trade anlegen und
        anschließend die Details hier vervollständigen.
      </div>
      <ul style={{ color: 'var(--muted)', marginLeft: 16 }}>
        <li>Ein Trade in der linken Liste anklicken, um Details zu laden.</li>
        <li>Im Formular links einen neuen Trade anlegen (Add) und hier nachbearbeiten.</li>
        <li>Änderungen werden beim Verlassen eines Felds (onBlur) validiert und können mit "Save now" gespeichert werden.</li>
      </ul>
    </div>
  )

  const fieldChange = <K extends keyof TradeInput>(key: K, value: TradeInput[K]) => {
    setLocal(prev => prev ? ({ ...prev, [key]: value }) : prev)
    setStatus('idle')
  }

  // Restore the editor contents to the initial loaded trade snapshot
  const restoreInitial = () => {
    const base = initialTradeRef.current
    if (!base) return
    // create a defensive clone so editors won't accidentally mutate the ref
    const clone: TradeInput = JSON.parse(JSON.stringify(base))
    setLocal(clone)
    setErrors({})
    setStatus('idle')
    if (onChange) onChange(clone)
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
        <SideSelect
          value={local.side as SideValue}
          onChange={(v: SideValue) => fieldChange('side', v)}
          ariaLabel="Trade side"
          showBadge={false}
          colored
          onBlur={() => handleBlurOrSave()}
          hasError={Boolean(errors.side)}
          ariaDescribedBy={errors.side ? 'detail-side-error' : undefined}
          className={styles.input}
        />
        {errors.side && <div id="detail-side-error" className={styles.fieldError}>{errors.side}</div>}

        <label className={styles.label}>Notes</label>
        <textarea aria-label="Notes" className={styles.textarea} value={local.notes ?? ''} onChange={(e) => fieldChange('notes', e.target.value)} onBlur={handleBlurOrSave} />

        <div style={{ marginTop: 12 }}>
          <Button
            type="button"
            variant="ghost"
            onClick={restoreInitial}
            disabled={!isDirty}
            aria-disabled={!isDirty}
            style={{ marginRight: 8 }}
          >
            Restore
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleBlurOrSave}
            disabled={saveDisabled}
            aria-disabled={saveDisabled}
            aria-busy={status === 'saving'}
            className={status === 'saving' ? styles.savingPulse : ''}
          >
            {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Save now'}
          </Button>
          {onDelete && local && (
            <Button
              type="button"
              variant="danger"
              onClick={() => onDelete(local.id)}
              className={styles.inlineDelete}
              style={{ marginLeft: 8 }}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
