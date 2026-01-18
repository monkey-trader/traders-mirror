import React from 'react';
import styles from './AnalysisCreatePanel.module.css';
import { Button } from '@/presentation/shared/components/Button/Button';
import { AnalysisEditor } from '@/presentation/analysis/AnalysisEditor';
import type { AnalysisFormValues } from '@/presentation/analysis/validation';
import type { TimeframeInput } from '@/presentation/analysis/types';

type Props = {
  open: boolean;
  compactView?: boolean;
  errorMessage?: string | null;
  formKey: number;
  onClose: () => void;
  onSubmit: (input: AnalysisFormValues & { timeframes?: TimeframeInput[] }) => Promise<void> | void;
};

export function AnalysisCreatePanel({
  open,
  compactView = false,
  errorMessage,
  formKey,
  onClose,
  onSubmit,
}: Props) {
  if (!open) return null;

  return (
    <section
      className={styles.panel}
      data-testid="analysis-create-panel"
      data-compact={compactView}
      aria-label="Neue Marktanalyse anlegen"
    >
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.panelKicker}>Workflow</p>
          <h3 className={styles.panelTitle}>Analyse anlegen</h3>
        </div>
        <div className={styles.panelActions}>
          <Button type="button" variant="ghost" className={styles.closeBtn} onClick={onClose}>
            Panel schließen
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <div className={styles.errorBanner} role="alert">
          {errorMessage}
        </div>
      ) : null}

      <div className={styles.editorWrap}>
        <AnalysisEditor key={formKey} focusField="symbol" onSave={onSubmit} />
      </div>
    </section>
  );
}

export default AnalysisCreatePanel;
