import React from 'react'
import { Card } from '@/presentation/shared/components/Card/Card'
import { Button } from '@/presentation/shared/components/Button/Button'
import { Input } from '@/presentation/shared/components/Input/Input'
import { SideSelect, type SideValue } from '@/presentation/shared/components/SideSelect/SideSelect'
import MarketSelect, { type MarketValue } from '@/presentation/shared/components/MarketSelect/MarketSelect'
import styles from '../../TradeJournal.module.css'

export type NewTradeFormState = {
  symbol: string
  entryDate: string
  size?: number
  price?: number
  side: SideValue
  status: 'OPEN' | 'CLOSED' | 'FILLED'
  notes: string
  sl?: number
  tp1?: number
  tp2?: number
  tp3?: number
  leverage?: number
  margin?: number
  market?: MarketValue
}

export type NewTradeFormProps = {
  form: NewTradeFormState
  formErrors: Record<string, string>
  touched: Record<string, boolean>
  formSubmitted: boolean
  formKey: number
  debugUiEnabled: boolean
  lastStatus?: string | null
  onChangeForm: (patch: Partial<NewTradeFormState>) => void
  onBlurField: (field: string) => void
  onSubmit: (e?: React.FormEvent) => void
  onReset: () => void
  setMarketFilter: (m: MarketValue | '') => void
}

export function NewTradeForm({
  form,
  formErrors,
  touched,
  formSubmitted,
  formKey,
  debugUiEnabled,
  lastStatus,
  onChangeForm,
  onBlurField,
  onSubmit,
  onReset,
  setMarketFilter
}: NewTradeFormProps) {
  return (
    <Card>
      <div className={styles.newTradeWrapper}>
        <div className={styles.newTradeHeader}>
          <span style={{ fontWeight: 700, color: 'var(--text)' }}>New Trade</span>
        </div>

        {debugUiEnabled && (lastStatus || Object.keys(formErrors).length > 0) && (
          <div className={styles.inlineStatus} style={{ margin: '8px 0', color: 'var(--muted)' }}>
            {lastStatus && <div style={{ marginBottom: 6 }}><strong>Status:</strong> {lastStatus}</div>}
            {Object.keys(formErrors).length > 0 && (
              <div style={{ color: 'var(--accent-error)' }}>
                <strong>Form errors:</strong>
                <ul style={{ margin: '6px 0 0 16px' }}>
                  {Object.entries(formErrors).map(([k, v]) => (
                    <li key={k}>{k}: {v}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <form key={formKey} className={styles.form} onSubmit={onSubmit}>
          <input id="entryDate" type="hidden" value={form.entryDate} />
          <div className={styles.newTradeGrid}>
            <div className={styles.newTradeField}>
              <MarketSelect
                label="Market"
                value={(form.market ?? '') as MarketValue}
                onChange={(v) => {
                  onChangeForm({ market: v })
                  onBlurField('market')
                  if (v) setMarketFilter(v)
                }}
                compact
                showAll={false}
                hasError={Boolean(formErrors.market && (touched.market || formSubmitted))}
                ariaDescribedBy={formErrors.market && (touched.market || formSubmitted) ? 'market-error' : undefined}
              />
              {(formErrors.market && (touched.market || formSubmitted)) && (
                <div id="market-error" className={styles.fieldError}>{formErrors.market}</div>
              )}
            </div>

            <div className={styles.newTradeField}>
              <Input
                id="symbol"
                label="Symbol"
                placeholder="e.g. BTC"
                value={form.symbol}
                onChange={(e) => onChangeForm({ symbol: e.target.value })}
                onBlur={() => onBlurField('symbol')}
                hasError={Boolean(formErrors.symbol && (touched.symbol || formSubmitted))}
                aria-describedby={formErrors.symbol && (touched.symbol || formSubmitted) ? 'symbol-error' : undefined}
              />
              {(formErrors.symbol && (touched.symbol || formSubmitted)) && (
                <div id="symbol-error" className={styles.fieldError}>
                  {formErrors.symbol}
                </div>
              )}
            </div>

            <div className={styles.newTradeField}>
              <Input
                id="price"
                label="Entry Price *"
                type="number"
                value={typeof form.price === 'number' ? String(form.price) : ''}
                onChange={(e) => onChangeForm({ price: e.target.value === '' ? undefined : Number(e.target.value) })}
                onBlur={() => onBlurField('price')}
                hasError={Boolean(formErrors.price && (touched.price || formSubmitted))}
                aria-describedby={formErrors.price && (touched.price || formSubmitted) ? 'price-error' : undefined}
              />
              {(formErrors.price && (touched.price || formSubmitted)) && (
                <div id="price-error" className={styles.fieldError}>
                  {formErrors.price}
                </div>
              )}
            </div>

            <div className={styles.newTradeField}>
              <Input
                id="margin"
                label="Margin *"
                type="number"
                value={typeof form.margin === 'number' ? String(form.margin) : ''}
                onChange={(e) => onChangeForm({ margin: e.target.value === '' ? undefined : Number(e.target.value) })}
                onBlur={() => onBlurField('margin')}
                hasError={Boolean(formErrors.margin && (touched.margin || formSubmitted))}
                aria-describedby={formErrors.margin && (touched.margin || formSubmitted) ? 'margin-error' : undefined}
              />
              {(formErrors.margin && (touched.margin || formSubmitted)) && (
                <div id="margin-error" className={styles.fieldError}>
                  {formErrors.margin}
                </div>
              )}
            </div>

            <div className={styles.newTradeField}>
              <Input
                id="leverage"
                label="Leverage *"
                type="number"
                value={typeof form.leverage === 'number' ? String(form.leverage) : ''}
                onChange={(e) => onChangeForm({ leverage: e.target.value === '' ? undefined : Number(e.target.value) })}
                onBlur={() => onBlurField('leverage')}
                hasError={Boolean(formErrors.leverage && (touched.leverage || formSubmitted))}
                aria-describedby={formErrors.leverage && (touched.leverage || formSubmitted) ? 'leverage-error' : undefined}
              />
              {(formErrors.leverage && (touched.leverage || formSubmitted)) && (
                <div id="leverage-error" className={styles.fieldError}>
                  {formErrors.leverage}
                </div>
              )}
            </div>

            <div className={styles.newTradeField}>
              <Input
                id="size"
                label="Position Size *"
                type="number"
                value={typeof form.size === 'number' ? String(form.size) : ''}
                onChange={(e) => onChangeForm({ size: e.target.value === '' ? undefined : Number(e.target.value) })}
                onBlur={() => onBlurField('size')}
                hasError={Boolean(formErrors.size && (touched.size || formSubmitted))}
                aria-describedby={formErrors.size && (touched.size || formSubmitted) ? 'size-error' : undefined}
              />
              {(formErrors.size && (touched.size || formSubmitted)) && (
                <div id="size-error" className={styles.fieldError}>
                  {formErrors.size}
                </div>
              )}
            </div>

            <div className={styles.newTradeField}>
              <Input
                id="sl"
                label="Stop Loss (SL) *"
                type="number"
                value={typeof form.sl === 'number' ? String(form.sl) : ''}
                onChange={(e) => onChangeForm({ sl: e.target.value === '' ? undefined : Number(e.target.value) })}
                onBlur={() => onBlurField('sl')}
                hasError={Boolean(formErrors.sl && (touched.sl || formSubmitted))}
                aria-describedby={formErrors.sl && (touched.sl || formSubmitted) ? 'sl-error' : undefined}
              />
              {(formErrors.sl && (touched.sl || formSubmitted)) && (
                <div id="sl-error" className={styles.fieldError}>
                  {formErrors.sl}
                </div>
              )}
            </div>

            <div className={styles.newTradeField}>
              <Input
                id="tp1"
                label="TP1"
                type="number"
                value={typeof form.tp1 === 'number' ? String(form.tp1) : ''}
                onChange={(e) => onChangeForm({ tp1: e.target.value === '' ? undefined : Number(e.target.value) })}
                onBlur={() => onBlurField('tp1')}
                hasError={Boolean(formErrors.tp1 && (touched.tp1 || formSubmitted))}
                aria-describedby={formErrors.tp1 && (touched.tp1 || formSubmitted) ? 'tp1-error' : undefined}
              />
              {(formErrors.tp1 && (touched.tp1 || formSubmitted)) && (
                <div id="tp1-error" className={styles.fieldError}>
                  {formErrors.tp1}
                </div>
              )}
            </div>

            <div className={styles.newTradeField}>
              <Input
                id="tp2"
                label="TP2"
                type="number"
                value={typeof form.tp2 === 'number' ? String(form.tp2) : ''}
                onChange={(e) => onChangeForm({ tp2: e.target.value === '' ? undefined : Number(e.target.value) })}
                onBlur={() => onBlurField('tp2')}
                hasError={Boolean(formErrors.tp2 && (touched.tp2 || formSubmitted))}
                aria-describedby={formErrors.tp2 && (touched.tp2 || formSubmitted) ? 'tp2-error' : undefined}
              />
              {(formErrors.tp2 && (touched.tp2 || formSubmitted)) && (
                <div id="tp2-error" className={styles.fieldError}>
                  {formErrors.tp2}
                </div>
              )}
            </div>

            <div className={styles.newTradeField}>
              <Input
                id="tp3"
                label="TP3"
                type="number"
                value={typeof form.tp3 === 'number' ? String(form.tp3) : ''}
                onChange={(e) => onChangeForm({ tp3: e.target.value === '' ? undefined : Number(e.target.value) })}
                onBlur={() => onBlurField('tp3')}
                hasError={Boolean(formErrors.tp3 && (touched.tp3 || formSubmitted))}
                aria-describedby={formErrors.tp3 && (touched.tp3 || formSubmitted) ? 'tp3-error' : undefined}
              />
              {(formErrors.tp3 && (touched.tp3 || formSubmitted)) && (
                <div id="tp3-error" className={styles.fieldError}>
                  {formErrors.tp3}
                </div>
              )}
            </div>

            <div className={`${styles.newTradeField} ${styles.full}`}>
              <Input
                label="Notes"
                value={form.notes}
                onChange={(e) => onChangeForm({ notes: e.target.value })}
              />
            </div>

            <div className={styles.newTradeField}>
              <span className={styles.fieldLabel}>Status</span>
              <select
                className={styles.input}
                value={form.status}
                onChange={(e) => { onChangeForm({ status: e.target.value as 'OPEN' | 'CLOSED' | 'FILLED' }); onBlurField('status') }}
                onBlur={() => onBlurField('status')}
              >
                <option value="OPEN">OPEN</option>
                <option value="FILLED">FILLED</option>
              </select>
            </div>

            <div className={styles.newTradeField}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className={styles.fieldLabel}>Side</span>
                <SideSelect
                  value={form.side}
                  onChange={(v) => onChangeForm({ side: v })}
                  ariaLabel="New trade side"
                  showBadge={false}
                  colored
                  onBlur={() => onBlurField('side')}
                />
              </div>
            </div>
          </div>

          <div className={styles.actions} style={{ marginTop: 12 }}>
            <Button
              variant="ghost"
              onClick={onReset}
              title="Reset form fields to defaults"
              aria-label="Reset new trade form"
            >
              Reset
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Add
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}
