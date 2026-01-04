import React, { useEffect, useState, useMemo, useRef } from 'react';
import type { TradeInput } from '@/domain/trade/factories/TradeFactory';
import { validateTrade } from '@/presentation/trade/validation';
import { mapTradeError } from '@/presentation/trade/errorMapper';
import styles from './TradeDetailEditor.module.css';
import { Button } from '@/presentation/shared/components/Button/Button';
import { IconButton } from '@/presentation/shared/components/IconButton/IconButton';
import { SideSelect, type SideValue } from '@/presentation/shared/components/SideSelect/SideSelect';
import {
  StatusSelect,
  type StatusValue,
} from '@/presentation/shared/components/StatusSelect/StatusSelect';
// no direct analysis factory usage here; creation delegated to TradeJournal via event

export type TradeDetailEditorProps = {
  trade: TradeInput | null;
  onChange?: (t: TradeInput) => void;
  onSave?: (t: TradeInput) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  compactView?: boolean;
};

export function TradeDetailEditor({
  trade,
  onChange,
  onSave,
  onDelete,
  compactView = false,
}: TradeDetailEditorProps) {
  const [local, setLocal] = useState<TradeInput | null>(trade);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');

  // (No local analysis creation here) — creation is delegated to TradeJournal via event

  useEffect(() => {
    setLocal(trade);
    setErrors({});
    setStatus('idle');
  }, [trade?.id]);

  // Keep an immutable snapshot of the trade as it was when loaded into the editor.
  // This avoids a race where parent onChange updates the canonical trade object
  // and causes a JSON-equality check against `trade` to reset the dirty flag.
  const initialTradeRef = useRef<TradeInput | null>(trade ?? null);
  useEffect(() => {
    initialTradeRef.current = trade ?? null;
  }, [trade?.id]);

  useEffect(() => {
    // notify parent immediately on change so parent can keep canonical list
    if (local && onChange) onChange(local);
  }, [local, onChange]);

  const validation = useMemo(() => (local ? validateTrade(local) : {}), [local]);
  const hasValidationErrors = Object.values(validation).some(Boolean);
  const isDirty = useMemo(() => {
    if (!local) return false;
    const base = initialTradeRef.current;
    if (!base) return true;
    try {
      return JSON.stringify(local) !== JSON.stringify(base);
    } catch {
      return true;
    }
  }, [local, /* initialTradeRef is stable */ hasValidationErrors]);

  if (!local)
    return (
      <div className={styles.empty}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Kein Trade ausgewählt</div>
        <div style={{ color: 'var(--muted)', marginBottom: 12 }}>
          Wähle einen Trade aus der Liste, um ihn hier anzusehen oder zu bearbeiten. Du kannst auch
          einen neuen Trade anlegen und anschließend die Details hier vervollständigen.
        </div>
        <ul style={{ color: 'var(--muted)', marginLeft: 16 }}>
          <li>Ein Trade in der linken Liste anklicken, um Details zu laden.</li>
          <li>Im Formular links einen neuen Trade anlegen (Add) und hier nachbearbeiten.</li>
          <li>
            Änderungen werden beim Verlassen eines Felds (onBlur) validiert und können mit "Save
            now" gespeichert werden.
          </li>
        </ul>
      </div>
    );

  const fieldChange = <K extends keyof TradeInput>(key: K, value: TradeInput[K]) => {
    setLocal((prev) => (prev ? { ...prev, [key]: value } : prev));
    setStatus('idle');
  };

  // Restore the editor contents to the initial loaded trade snapshot
  const restoreInitial = () => {
    const base = initialTradeRef.current;
    if (!base) return;
    // create a defensive clone so editors won't accidentally mutate the ref
    const clone: TradeInput = JSON.parse(JSON.stringify(base));
    setLocal(clone);
    setErrors({});
    setStatus('idle');
    if (onChange) onChange(clone);
  };

  const handleBlurOrSave = async () => {
    if (!local) return;
    const v = validateTrade(local);
    const hasErrors = Object.values(v).some(Boolean);
    setErrors(v);
    if (hasErrors) return;
    if (!onSave) return;

    setStatus('saving');
    try {
      await onSave(local);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 1200);
    } catch (err) {
      const mapped = mapTradeError(err);
      if (mapped.field) {
        const field = mapped.field;
        setErrors((prev) => ({ ...prev, [field]: mapped.message }));
      }
      setStatus('failed');
      // Do not re-throw here. We've mapped the error to field-level messages and updated status.
      // Re-throwing caused unhandled promise rejections in the test environment.
      return;
    }
  };

  // Keep save enabled when validation errors exist even if the editor isn't dirty.
  // Tests expect clicking Save on an invalid (but not changed) trade to run validation and block saving.
  const saveDisabled = status === 'saving' || (!isDirty && !hasValidationErrors) || !onSave;

  const openAnalysis = (aid: string) => {
    try {
      globalThis.location.hash = `#/analysis?id=${encodeURIComponent(aid ?? '')}`;
          setTimeout(() => {
            try {
              globalThis.dispatchEvent(new CustomEvent('open-analysis', { detail: { id: aid } }));
            } catch {
              /* ignore */
            }
          }, 50);
    } catch {
      // ignore
    }
  };

  // Normalize side values coming from stored trades or user input.
  // Some data sources may include stray quotes or different casing (e.g. "'LONG", "buy").
  const normalizeSide = (s: unknown): 'LONG' | 'SHORT' => {
    try {
      const raw = String(s ?? '').replace(/['"`]/g, '').trim().toLowerCase();
      return raw === 'long' || raw === 'buy' ? 'LONG' : 'SHORT';
    } catch {
      return 'LONG';
    }
  };

  return (
    <div className={`${styles.editor} ${compactView ? styles.compact : ''}`} aria-live="polite">
      <div className={styles.header}>
        <div className={styles.title}>
          {local.symbol} <span className={styles.sub}>#{local.id}</span>
        </div>
        {local.analysisId ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconButton
              ariaLabel="Open analysis"
              variant="ghost"
              color="primary"
              onClick={() => openAnalysis(local.analysisId as string)}
              className={styles.analysisLink}
              title="Open analysis"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className={styles.analysisIcon}
                  aria-hidden
                  style={{ width: 18, height: 18 }}
                >
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor" />
                </svg>
              }
            />
          </div>
        ) : null}
          {!local.analysisId ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button
                variant="primary"
                onClick={async () => {
                  if (!local) return;
                  try {
                    // Instead of creating the analysis directly, open the Add Analysis
                    // panel prefilled so the user can choose market and save there.
                    const marketValue =
                      local.market === 'Forex' || local.market === 'Crypto'
                        ? (local.market as 'Forex' | 'Crypto')
                        : undefined;
                    globalThis.dispatchEvent(
                      new CustomEvent('prefill-analysis', {
                        detail: {
                          tradeId: local.id,
                          symbol: local.symbol,
                          notes: local.notes,
                          market: marketValue,
                        },
                      })
                    );
                    setStatus('idle');
                  } catch {
                    setStatus('failed');
                  }
                }}
                className={styles.createBtn}
                style={{ marginLeft: 8 }}
              >
                Create Analyse
              </Button>
            </div>
          ) : null}
        <div className={styles.saveStatus} aria-hidden={status === 'idle'}>
          {status === 'saving'
            ? 'Saving…'
            : status === 'saved'
            ? 'Saved'
            : status === 'failed'
            ? 'Failed'
            : ''}
        </div>
      </div>

      <div className={styles.form}>
        <label className={styles.label}>Symbol</label>
        <input
          aria-label="Symbol"
          className={styles.input}
          value={local.symbol}
          onChange={(e) => fieldChange('symbol', e.target.value)}
          onBlur={handleBlurOrSave}
        />
        {errors.symbol && <div className={styles.fieldError}>{errors.symbol}</div>}

        <label className={styles.label}>Entry Date</label>
        <input
          aria-label="Entry Date"
          className={styles.input}
          type="datetime-local"
          value={local.entryDate}
          onChange={(e) => fieldChange('entryDate', e.target.value)}
          onBlur={handleBlurOrSave}
        />
        {errors.entryDate && <div className={styles.fieldError}>{errors.entryDate}</div>}

        <label className={styles.label}>Size</label>
        <input
          aria-label="Size"
          className={styles.input}
          type="number"
          value={local.size}
          onChange={(e) => fieldChange('size', Number(e.target.value))}
          onBlur={handleBlurOrSave}
        />
        {errors.size && <div className={styles.fieldError}>{errors.size}</div>}

        <label className={styles.label}>Price</label>
        <input
          aria-label="Price"
          className={styles.input}
          type="number"
          value={local.price}
          onChange={(e) => fieldChange('price', Number(e.target.value))}
          onBlur={handleBlurOrSave}
        />
        {errors.price && <div className={styles.fieldError}>{errors.price}</div>}

        <label className={styles.label}>Side</label>
        <SideSelect
          value={normalizeSide(local.side) as SideValue}
          onChange={(v: SideValue) => fieldChange('side', v)}
          ariaLabel="Trade side"
          showBadge={false}
          colored
          onBlur={() => handleBlurOrSave()}
          hasError={Boolean(errors.side)}
          ariaDescribedBy={errors.side ? 'detail-side-error' : undefined}
          className={styles.input}
        />
        {errors.side && (
          <div id="detail-side-error" className={styles.fieldError}>
            {errors.side}
          </div>
        )}

        <label className={styles.label}>Status</label>
        <StatusSelect
          value={(local.status ?? 'OPEN') as StatusValue}
          onChange={(v: StatusValue) => fieldChange('status', v)}
          ariaLabel="Trade status"
          compact
          colored
          onBlur={() => handleBlurOrSave()}
          hasError={Boolean(errors.status)}
          ariaDescribedBy={errors.status ? 'detail-status-error' : undefined}
        />
        {errors.status && (
          <div id="detail-status-error" className={styles.fieldError}>
            {errors.status}
          </div>
        )}

        <label className={styles.label}>Notes</label>
        <textarea
          aria-label="Notes"
          className={styles.textarea}
          value={local.notes ?? ''}
          onChange={(e) => fieldChange('notes', e.target.value)}
          onBlur={handleBlurOrSave}
        />

        <label className={styles.label}>TP1</label>
        <input
          aria-label="TP1"
          className={styles.input}
          type="number"
          value={local.tp1 ?? ''}
          onChange={(e) =>
            fieldChange('tp1', e.target.value === '' ? undefined : Number(e.target.value))
          }
          onBlur={handleBlurOrSave}
        />
        {errors.tp1 && <div className={styles.fieldError}>{errors.tp1}</div>}

        <label className={styles.label}>TP2</label>
        <input
          aria-label="TP2"
          className={styles.input}
          type="number"
          value={local.tp2 ?? ''}
          onChange={(e) =>
            fieldChange('tp2', e.target.value === '' ? undefined : Number(e.target.value))
          }
          onBlur={handleBlurOrSave}
        />
        {errors.tp2 && <div className={styles.fieldError}>{errors.tp2}</div>}

        <label className={styles.label}>TP3</label>
        <input
          aria-label="TP3"
          className={styles.input}
          type="number"
          value={local.tp3 ?? ''}
          onChange={(e) =>
            fieldChange('tp3', e.target.value === '' ? undefined : Number(e.target.value))
          }
          onBlur={handleBlurOrSave}
        />
        {errors.tp3 && <div className={styles.fieldError}>{errors.tp3}</div>}

        <label className={styles.label}>TP4</label>
        <input
          aria-label="TP4"
          className={styles.input}
          type="number"
          value={local.tp4 ?? ''}
          onChange={(e) =>
            fieldChange('tp4', e.target.value === '' ? undefined : Number(e.target.value))
          }
          onBlur={handleBlurOrSave}
        />
        {errors.tp4 && <div className={styles.fieldError}>{errors.tp4}</div>}

        <label className={styles.label}>Margin</label>
        <input
          aria-label="Margin"
          className={styles.input}
          type="number"
          value={local.margin ?? ''}
          onChange={(e) =>
            fieldChange('margin', e.target.value === '' ? undefined : Number(e.target.value))
          }
          onBlur={handleBlurOrSave}
        />
        {errors.margin && <div className={styles.fieldError}>{errors.margin}</div>}

        <label className={styles.label}>Leverage</label>
        <input
          aria-label="Leverage"
          className={styles.input}
          type="number"
          value={local.leverage ?? ''}
          onChange={(e) =>
            fieldChange('leverage', e.target.value === '' ? undefined : Number(e.target.value))
          }
          onBlur={handleBlurOrSave}
        />
        {errors.leverage && <div className={styles.fieldError}>{errors.leverage}</div>}

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
            className={`${styles.saveBtn} ${status === 'saving' ? styles.savingPulse : ''}`.trim()}
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
  );
}
