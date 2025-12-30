import React from 'react';
import styles from '../../TradeJournal.module.css';
import { Button } from '@/presentation/shared/components/Button/Button';
import { NewTradeForm, type NewTradeFormState } from '../NewTradeForm/NewTradeForm';
import type { MarketValue } from '@/presentation/shared/components/MarketSelect/MarketSelect';

type Props = {
  isMobile: boolean;
  newTradeModalOpen: boolean;
  setNewTradeModalOpen: (v: boolean) => void;
  form: NewTradeFormState;
  formErrors: Record<string, string>;
  touched: Record<string, boolean>;
  formSubmitted: boolean;
  formKey: number;
  debugUiEnabled: boolean;
  lastStatus: string | null;
  onChangeForm: (patch: Partial<NewTradeFormState>) => void;
  onBlurField: (f: string) => void;
  // allow async onSubmit so callers (TradeJournal) can forward async handleAdd
  onSubmit: (e?: React.FormEvent) => Promise<void> | void;
  onReset: () => void;
  setMarketFilter: (m: MarketValue | '') => void;
  handleAdd: (e?: React.FormEvent) => Promise<void>;
};

export function MobileNewTrade({
  isMobile,
  newTradeModalOpen,
  setNewTradeModalOpen,
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
}: Props) {
  if (!isMobile) return null;

  return (
    <>
      <div className={styles.mobileNewTradeBtnWrap}>
        <button
          type="button"
          className={styles.mobileNewTradeBtn}
          onClick={() => setNewTradeModalOpen(true)}
        >
          New Trade
        </button>
      </div>

      {newTradeModalOpen && (
        <div
          className={styles.mobileModalBackdrop}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          onClick={() => setNewTradeModalOpen(false)}
        >
          <div
            className={styles.mobileModalContent}
            onClick={(e) => e.stopPropagation()}
            tabIndex={0}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setNewTradeModalOpen(false)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'none',
                border: 'none',
                fontSize: 22,
                cursor: 'pointer',
              }}
            >
              ×
            </button>
            <div style={{ marginBottom: 12, fontWeight: 700, fontSize: 18 }}>New Trade</div>
            <NewTradeForm
              form={form}
              formErrors={formErrors}
              touched={touched}
              formSubmitted={formSubmitted}
              formKey={formKey}
              debugUiEnabled={debugUiEnabled}
              lastStatus={lastStatus}
              onChangeForm={onChangeForm}
              onBlurField={onBlurField}
              onSubmit={onSubmit}
              onReset={onReset}
              setMarketFilter={setMarketFilter}
            />

            <div className={styles.mobileModalFooter}>
              <Button variant="ghost" onClick={() => setNewTradeModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  // await the async onSubmit (which forwards to handleAdd) so callers do not ignore the Promise
                  try {
                    await onSubmit();
                  } catch {
                    // swallow errors here; real errors are surfaced by the form's validation/state
                    // Intentionally not logging to avoid noisy console in tests
                  }
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MobileNewTrade;
