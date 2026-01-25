import React, { useEffect, useRef, useState } from 'react';
import AddFormCard from '@/presentation/shared/components/AddFormCard/AddFormCard';
import { Button } from '@/presentation/shared/components/Button/Button';
import { Input } from '@/presentation/shared/components/Input/Input';
import SymbolAutocomplete from '@/presentation/shared/components/SymbolAutocomplete/SymbolAutocomplete';
import { SideSelect, type SideValue } from '@/presentation/shared/components/SideSelect/SideSelect';
import MarketSelect, {
  type MarketValue,
} from '@/presentation/shared/components/MarketSelect/MarketSelect';
import { StatusSelect } from '@/presentation/shared/components/StatusSelect/StatusSelect';
import styles from './NewTradeForm.module.css';
import { SetupSelector } from '../SetupSelector';
import type { ConfluenceOption } from '../ConfluenceModal';
import { Switch } from '@/presentation/shared/components/Switch/Switch';

export type NewTradeFormState = {
  symbol: string;
  entryDate: string;
  size?: number;
  price?: number;
  side: SideValue;
  status: 'OPEN' | 'CLOSED' | 'FILLED';
  notes?: string;
  sl?: number;
  tp1?: number;
  tp2?: number;
  tp3?: number;
  tp4?: number;
  leverage?: number;
  margin?: number;
  market?: MarketValue;
  isShortTerm?: boolean;
  analysisId?: string; // optional originating analysis id
  fibLevel?: string | null;
  confluence?: ConfluenceOption[];
};

export type NewTradeFormProps = {
  form: NewTradeFormState;
  formErrors: Record<string, string>;
  touched: Record<string, boolean>;
  formSubmitted: boolean;
  formKey: number;
  debugUiEnabled: boolean;
  lastStatus?: string | null;
  onChangeForm: (patch: Partial<NewTradeFormState>) => void;
  onBlurField: (field: string) => void;
  // allow async handlers so callers can await internal async logic (e.g., handleAdd)
  onSubmit: (e?: React.FormEvent) => Promise<void> | void;
  onReset: () => void;
  setMarketFilter: (m: MarketValue | '') => void;
};

function CurrentPriceIndicator({ symbol, market }: { symbol?: string; market?: string | null }) {
  const [price, setPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const debounceRef = useRef<number | null>(null)
  const fetchIdRef = useRef(0)

  useEffect(() => {
    // only show for crypto market and when symbol looks present
    if (!symbol || !market || market.toLowerCase() !== 'crypto') {
      setPrice(null)
      setLoading(false)
      setErr(null)
      return
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(async () => {
      const myFetchId = ++fetchIdRef.current
      setLoading(true)
      setErr(null)
      try {
        const { getPriceService } = await import('@/infrastructure/price/priceSingleton')
        const svc = getPriceService()
        // debug: log requested symbol/market
        // eslint-disable-next-line no-console
        console.debug('[CurrentPriceIndicator] fetching price for', { symbol, market })
        const res = await svc.getCryptoPrice(symbol, 'usd')
        // eslint-disable-next-line no-console
        console.debug('[CurrentPriceIndicator] price service res', res)
        if (fetchIdRef.current === myFetchId) {
          setPrice(res.price ?? null)
        }
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.debug('[CurrentPriceIndicator] price fetch error', e)
        if (fetchIdRef.current === myFetchId) {
          setErr('—')
          setPrice(null)
        }
      } finally {
        if (fetchIdRef.current === myFetchId) setLoading(false)
      }
    }, 500)

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [symbol, market])

  if (!symbol || !market || market.toLowerCase() !== 'crypto') return null

  const formatPrice = (p: number) => {
    if (p >= 1) return p.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
    // for tiny crypto values use up to 8 decimals
    return p.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 8 })
  }

  return (
    <div className={styles.currentPrice} aria-hidden>
      <span className={styles.dot} />
      <span className={styles.priceValue}>{loading ? '…' : price !== null ? formatPrice(price) : err ?? '—'}</span>
      <span style={{ color: 'var(--muted)', fontSize: 12, marginLeft: 6 }}>current</span>
    </div>
  )
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
  setMarketFilter,
}: NewTradeFormProps) {
  const headerActions = form.analysisId ? (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>Prefilled from analysis</span>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          try {
            window.location.hash = `#/analysis?id=${encodeURIComponent(form.analysisId ?? '')}`;
            setTimeout(() => {
              try {
                window.dispatchEvent(
                  new CustomEvent('open-analysis', { detail: { id: form.analysisId } })
                );
              } catch {
                /* ignore */
              }
            }, 50);
          } catch {
            /* ignore */
          }
        }}
        className={styles.viewAnalysisBtn}
        style={{ padding: '6px 8px', borderRadius: 6 }}
      >
        View Analysis
      </Button>
    </div>
  ) : undefined;

  return (
    <AddFormCard title="New Trade" actions={headerActions}>
      <div className={styles.newTradeWrapper}>
        {debugUiEnabled && (lastStatus || Object.keys(formErrors).length > 0) && (
          <div className={styles.inlineStatus} style={{ margin: '8px 0', color: 'var(--muted)' }}>
            {lastStatus && (
              <div style={{ marginBottom: 6 }}>
                <strong>Status:</strong> {lastStatus}
              </div>
            )}
            {Object.keys(formErrors).length > 0 && (
              <div style={{ color: 'var(--accent-error)' }}>
                <strong>Form errors:</strong>
                <ul style={{ margin: '6px 0 0 16px' }}>
                  {Object.entries(formErrors).map(([k, v]) => (
                    <li key={k}>
                      {k}: {v}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <form key={formKey} className={styles.form} onSubmit={onSubmit}>
          <input id="entryDate" type="hidden" value={form.entryDate} />
          <input id="analysisId" type="hidden" value={form.analysisId ?? ''} />
          <div className={styles.newTradeGrid}>
            <div className={styles.newTradeField}>
              <MarketSelect
                label="Market"
                value={(form.market ?? '') as MarketValue}
                onChange={(v) => {
                  onChangeForm({ market: v });
                  onBlurField('market');
                  if (v) setMarketFilter(v);
                }}
                compact
                showAll={false}
                hasError={Boolean(formErrors.market && (touched.market || formSubmitted))}
                ariaDescribedBy={
                  formErrors.market && (touched.market || formSubmitted)
                    ? 'market-error'
                    : undefined
                }
              />
              <div className={styles.shortTermRow}>
                <div className={styles.shortTermControl}>
                  <div className={styles.switchWrapper}>
                    <Switch
                      id="isShortTerm"
                      checked={Boolean(form.isShortTerm)}
                      onChange={(v) => onChangeForm({ isShortTerm: v })}
                      ariaLabel="Short-term trade"
                    />
                  </div>
                  <div className={styles.shortTermLabel}>Short-term</div>
                </div>
                <div className={styles.shortTermHelper}>no compounding</div>
              </div>
              {formErrors.market && (touched.market || formSubmitted) && (
                <div id="market-error" className={styles.fieldError}>
                  {formErrors.market}
                </div>
              )}
            </div>

            <div className={styles.newTradeField}>
              <label htmlFor="symbol">Symbol</label>
              <SymbolAutocomplete
                value={form.symbol}
                placeholder="e.g. BTC"
                id="symbol"
                market={form.market ?? ''}
                onChange={(v) => onChangeForm({ symbol: v })}
                onSelect={async (s) => {
                  // when a suggestion is chosen, set symbol and trigger blur
                  onChangeForm({ symbol: s.symbol.toUpperCase() })
                  onBlurField('symbol')
                  // attempt to prefill price using the selected coin id via singleton
                  try {
                    const { getPriceService } = await import('@/infrastructure/price/priceSingleton')
                    const svc = getPriceService()
                    const res = await svc.getCryptoPrice(s.id, 'usd')
                    if (res && typeof res.price === 'number' && !Number.isNaN(res.price)) {
                      onChangeForm({ price: res.price })
                    }
                  } catch {
                    // ignore price prefill failures
                  }
                }}
              />
              {formErrors.symbol && (touched.symbol || formSubmitted) && (
                <div id="symbol-error" className={styles.fieldError}>
                  {formErrors.symbol}
                </div>
              )}
            </div>

            {/* SetupSelector: SK Entry & Confluence */}
            <div className={styles.newTradeField}>
              <SetupSelector
                selectedFibLevel={form.fibLevel ?? null}
                selectedConfluence={form.confluence ?? []}
                onChange={(fibLevel: string | null, confluence: ConfluenceOption[]) => {
                  onChangeForm({ fibLevel, confluence });
                }}
                compact
              />
            </div>

            <div className={styles.newTradeField}>
              <Input
                id="price"
                label="Entry Price *"
                type="number"
                value={typeof form.price === 'number' ? String(form.price) : ''}
                onChange={(e) =>
                  onChangeForm({
                    price: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
                onBlur={() => onBlurField('price')}
                hasError={Boolean(formErrors.price && (touched.price || formSubmitted))}
                aria-describedby={
                  formErrors.price && (touched.price || formSubmitted) ? 'price-error' : undefined
                }
              />
              {formErrors.price && (touched.price || formSubmitted) && (
                <div id="price-error" className={styles.fieldError}>
                  {formErrors.price}
                </div>
              )}
              {/* Current price indicator (non-intrusive) */}
              <CurrentPriceIndicator symbol={form.symbol} market={form.market} />
            </div>

            <div className={styles.newTradeField}>
              <Input
                id="margin"
                label="Margin *"
                type="number"
                value={typeof form.margin === 'number' ? String(form.margin) : ''}
                onChange={(e) =>
                  onChangeForm({
                    margin: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
                onBlur={() => onBlurField('margin')}
                hasError={Boolean(formErrors.margin && (touched.margin || formSubmitted))}
                aria-describedby={
                  formErrors.margin && (touched.margin || formSubmitted)
                    ? 'margin-error'
                    : undefined
                }
              />
              {formErrors.margin && (touched.margin || formSubmitted) && (
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
                onChange={(e) =>
                  onChangeForm({
                    leverage: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
                onBlur={() => onBlurField('leverage')}
                hasError={Boolean(formErrors.leverage && (touched.leverage || formSubmitted))}
                aria-describedby={
                  formErrors.leverage && (touched.leverage || formSubmitted)
                    ? 'leverage-error'
                    : undefined
                }
              />
              {formErrors.leverage && (touched.leverage || formSubmitted) && (
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
                onChange={(e) =>
                  onChangeForm({ size: e.target.value === '' ? undefined : Number(e.target.value) })
                }
                onBlur={() => onBlurField('size')}
                hasError={Boolean(formErrors.size && (touched.size || formSubmitted))}
                aria-describedby={
                  formErrors.size && (touched.size || formSubmitted) ? 'size-error' : undefined
                }
              />
              {formErrors.size && (touched.size || formSubmitted) && (
                <div id="size-error" className={styles.fieldError}>
                  {formErrors.size}
                </div>
              )}
            </div>

            <div className={styles.newTradeField}>
              <SideSelect
                label="Side"
                value={form.side}
                onChange={(v) => onChangeForm({ side: v })}
                ariaLabel="New trade side"
                showBadge={false}
                colored
                onBlur={() => onBlurField('side')}
                hasError={Boolean(formErrors.side && (touched.side || formSubmitted))}
                ariaDescribedBy={
                  formErrors.side && (touched.side || formSubmitted) ? 'side-error' : undefined
                }
              />
              {formErrors.side && (touched.side || formSubmitted) && (
                <div id="side-error" className={styles.fieldError}>
                  {formErrors.side}
                </div>
              )}
            </div>

            <div className={styles.newTradeField}>
              <Input
                id="sl"
                label="Stop Loss (SL) *"
                type="number"
                value={typeof form.sl === 'number' ? String(form.sl) : ''}
                onChange={(e) =>
                  onChangeForm({ sl: e.target.value === '' ? undefined : Number(e.target.value) })
                }
                onBlur={() => onBlurField('sl')}
                hasError={Boolean(formErrors.sl && (touched.sl || formSubmitted))}
                aria-describedby={
                  formErrors.sl && (touched.sl || formSubmitted) ? 'sl-error' : undefined
                }
              />
              {formErrors.sl && (touched.sl || formSubmitted) && (
                <div id="sl-error" className={styles.fieldError}>
                  {formErrors.sl}
                </div>
              )}
            </div>

            <div className={styles.tpFullWidthRow}>
              <div className={styles.tpField}>
                <Input
                  id="tp1"
                  label="TP1"
                  type="number"
                  value={typeof form.tp1 === 'number' ? String(form.tp1) : ''}
                  onChange={(e) =>
                    onChangeForm({
                      tp1: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                  onBlur={() => onBlurField('tp1')}
                  hasError={Boolean(formErrors.tp1 && (touched.tp1 || formSubmitted))}
                  aria-describedby={
                    formErrors.tp1 && (touched.tp1 || formSubmitted) ? 'tp1-error' : undefined
                  }
                />
                {formErrors.tp1 && (touched.tp1 || formSubmitted) && (
                  <div id="tp1-error" className={styles.fieldError}>
                    {formErrors.tp1}
                  </div>
                )}
              </div>
              <div className={styles.tpField}>
                <Input
                  id="tp2"
                  label="TP2"
                  type="number"
                  value={typeof form.tp2 === 'number' ? String(form.tp2) : ''}
                  onChange={(e) =>
                    onChangeForm({
                      tp2: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                  onBlur={() => onBlurField('tp2')}
                  hasError={Boolean(formErrors.tp2 && (touched.tp2 || formSubmitted))}
                  aria-describedby={
                    formErrors.tp2 && (touched.tp2 || formSubmitted) ? 'tp2-error' : undefined
                  }
                />
                {formErrors.tp2 && (touched.tp2 || formSubmitted) && (
                  <div id="tp2-error" className={styles.fieldError}>
                    {formErrors.tp2}
                  </div>
                )}
              </div>
              <div className={styles.tpField}>
                <Input
                  id="tp3"
                  label="TP3"
                  type="number"
                  value={typeof form.tp3 === 'number' ? String(form.tp3) : ''}
                  onChange={(e) =>
                    onChangeForm({
                      tp3: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                  onBlur={() => onBlurField('tp3')}
                  hasError={Boolean(formErrors.tp3 && (touched.tp3 || formSubmitted))}
                  aria-describedby={
                    formErrors.tp3 && (touched.tp3 || formSubmitted) ? 'tp3-error' : undefined
                  }
                />
                {formErrors.tp3 && (touched.tp3 || formSubmitted) && (
                  <div id="tp3-error" className={styles.fieldError}>
                    {formErrors.tp3}
                  </div>
                )}
              </div>
              <div className={styles.tpField}>
                <Input
                  id="tp4"
                  label="TP4"
                  type="number"
                  value={typeof form.tp4 === 'number' ? String(form.tp4) : ''}
                  onChange={(e) =>
                    onChangeForm({
                      tp4: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                  onBlur={() => onBlurField('tp4')}
                  hasError={Boolean(formErrors.tp4 && (touched.tp4 || formSubmitted))}
                  aria-describedby={
                    formErrors.tp4 && (touched.tp4 || formSubmitted) ? 'tp4-error' : undefined
                  }
                />
                {formErrors.tp4 && (touched.tp4 || formSubmitted) && (
                  <div id="tp4-error" className={styles.fieldError}>
                    {formErrors.tp4}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.notesFullWidthField}>
              <Input
                id="notes"
                label="Notes"
                value={(form.notes ?? '') as string}
                onChange={(e) => onChangeForm({ notes: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.actionsRow}>
            <div className={styles.statusActionField}>
              <StatusSelect
                label="Status"
                value={form.status}
                onChange={(v) => {
                  onChangeForm({ status: v });
                  onBlurField('status');
                }}
                onBlur={() => onBlurField('status')}
                hasError={Boolean(formErrors.status && (touched.status || formSubmitted))}
                ariaDescribedBy={
                  formErrors.status && (touched.status || formSubmitted)
                    ? 'status-error'
                    : undefined
                }
              />
              {formErrors.status && (touched.status || formSubmitted) && (
                <div id="status-error" className={styles.fieldError}>
                  {formErrors.status}
                </div>
              )}
            </div>
            <div className={styles.actions}>
              <Button
                variant="ghost"
                onClick={onReset}
                title="Reset form fields to defaults"
                aria-label="Reset new trade form"
              >
                Reset
              </Button>
              <Button type="submit" variant="primary">
                {form.analysisId ? 'Add (from Analysis)' : 'Add'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AddFormCard>
  );
}
