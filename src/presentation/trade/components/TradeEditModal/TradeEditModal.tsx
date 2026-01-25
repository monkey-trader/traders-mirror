import React, { useEffect, useState } from 'react'
import styles from '../../TradeJournal.module.css'
import { NewTradeForm } from '../../components/NewTradeForm/NewTradeForm'
import { Button } from '@/presentation/shared/components/Button/Button'
import type { TradeRow } from '../../types'
import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository'
import { validateNewTrade } from '@/presentation/trade/validation'
import { TradeFactory } from '@/domain/trade/factories/TradeFactory'

type Props = {
  open: boolean
  onClose: () => void
  trade: TradeRow | null
  repoRef: React.MutableRefObject<TradeRepository | null>
  setPositions: React.Dispatch<React.SetStateAction<TradeRow[]>>
  setMarketFilter?: (m: any) => void
}

export function TradeEditModal({ open, onClose, trade, repoRef, setPositions, setMarketFilter }: Props) {
  const [form, setForm] = useState<any>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!trade) {
      setForm(null)
      return
    }
    setForm({
      symbol: trade.symbol,
      entryDate: trade.entryDate,
      size: trade.size,
      price: trade.price,
      side: (trade.side as any) ?? 'LONG',
      status: (trade.status as any) ?? 'OPEN',
      notes: trade.notes ?? '',
      sl: trade.sl,
      tp1: trade.tp1,
      tp2: trade.tp2,
      tp3: trade.tp3,
      tp4: trade.tp4,
      margin: trade.margin,
      leverage: trade.leverage,
      market: (trade.market as any) ?? 'Crypto',
      analysisId: trade.analysisId,
      fibLevel: trade.entry ?? null,
      confluence: (trade.confluence as any) ?? [],
      isShortTerm: trade.isShortTerm,
    })
  }, [trade])

  if (!open || !form) return null

  const onChangeForm = (patch: Partial<any>) => setForm((prev: any) => ({ ...prev, ...patch }))

  const onBlurField = (field: string) => setTouched((t) => ({ ...t, [field]: true }))

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault()
    setSubmitted(true)
    // basic validation reuse
    const toValidate = {
      symbol: form.symbol,
      entryDate: form.entryDate,
      size: form.size,
      price: form.price,
      side: form.side,
      market: form.market,
      sl: form.sl,
      margin: form.margin,
      leverage: form.leverage,
    }
    const validation = validateNewTrade(toValidate as any)
    const mapped: Record<string, string> = {}
    validation.forEach((v) => {
      if (v && v.field) mapped[v.field] = v.message
    })
    if (Object.keys(mapped).length > 0) {
      setErrors(mapped)
      setTouched((prev) => ({ ...prev, ...Object.fromEntries(Object.keys(mapped).map((k) => [k, true])) }))
      return
    }

    // build domain Trade and call update
    try {
      if (!repoRef.current) {
        // local update fallback
        setPositions((prev) => prev.map((p) => (p.id === trade?.id ? { ...p, ...form } : p)))
      } else {
        const domain = TradeFactory.create({ id: trade?.id, ...form } as any)
        await repoRef.current.update(domain as any)
        const all = await repoRef.current.getAll()
        const dto = all.map((t) => TradeFactory.toDTO(t) as unknown as TradeRow)
        setPositions(dto)
      }
      onClose()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('update failed', err)
    }
  }

  return (
    <div className={styles.backdrop} role="dialog" aria-modal>
      <div className={styles.mockDialog} style={{ width: 720 }}>
        <h3>Edit Trade</h3>
        <NewTradeForm
          form={form}
          formErrors={errors}
          touched={touched}
          formSubmitted={submitted}
          formKey={0}
          debugUiEnabled={false}
          lastStatus={null}
          onChangeForm={onChangeForm}
          onBlurField={onBlurField}
          onSubmit={handleSubmit}
          onReset={() => {
            // reset to original trade values
            if (trade) setForm({ ...form })
          }}
          hideSubmit
          hideReset
          title="Edit Trade"
          setMarketFilter={setMarketFilter ?? (() => {})}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <Button type="button" variant="ghost" onClick={onClose} aria-label="Cancel edit">
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit} aria-label="Save edit">
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TradeEditModal
