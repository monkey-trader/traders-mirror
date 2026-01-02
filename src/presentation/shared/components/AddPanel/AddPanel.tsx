import React from 'react';
import { NewTradeForm } from '@/presentation/trade/components/NewTradeForm/NewTradeForm';
import AddFormCard from '@/presentation/shared/components/AddFormCard/AddFormCard';
import { AnalysisEditor } from '@/presentation/analysis/AnalysisEditor';
import type { NewTradeFormState } from '@/presentation/trade/hooks/useNewTradeForm';
import type { AnalysisFormValues } from '@/presentation/analysis/validation';
import type { TimeframeInput } from '@/presentation/analysis/types';

type Mode = 'trade' | 'analysis';

type Props = {
  mode: Mode;
  // NewTradeForm props
  isMobile?: boolean;
  form?: NewTradeFormState;
  formErrors?: Record<string, string>;
  touched?: Record<string, boolean>;
  formSubmitted?: boolean;
  formKey?: number;
  debugUiEnabled?: boolean;
  lastStatus?: string | null;
  onChangeForm?: (patch: Partial<NewTradeFormState>) => void;
  onBlurField?: (f: string) => void;
  onSubmit?: (e?: React.FormEvent) => Promise<void> | void;
  onReset?: () => void;
  setMarketFilter?: (m: string) => void;
  // Analysis handler
  onSaveAnalysis?: (
    input: AnalysisFormValues & { timeframes?: TimeframeInput[] }
  ) => Promise<void> | void;
};

export function AddPanel({
  mode,
  // trade props
  isMobile,
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
  // analysis
  onSaveAnalysis,
}: Props) {
  if (mode === 'analysis') {
    return (
      <div data-testid="add-panel-analysis">
        <AddFormCard title="Add Analysis">
          <div style={{ marginTop: 12 }}>
            <AnalysisEditor onSave={onSaveAnalysis} />
          </div>
        </AddFormCard>
      </div>
    );
  }

  // default: trade mode
  return (
    <div data-testid="add-panel-trade">
      {!isMobile && (
        <NewTradeForm
          form={form as NewTradeFormState}
          formErrors={formErrors ?? {}}
          touched={touched ?? {}}
          formSubmitted={formSubmitted ?? false}
          formKey={formKey ?? 0}
          debugUiEnabled={debugUiEnabled ?? false}
          lastStatus={lastStatus ?? null}
          onChangeForm={onChangeForm ?? (() => {})}
          onBlurField={onBlurField ?? (() => {})}
          onSubmit={onSubmit ?? (() => {})}
          onReset={onReset ?? (() => {})}
          setMarketFilter={setMarketFilter ?? (() => {})}
        />
      )}
    </div>
  );
}

export default AddPanel;
