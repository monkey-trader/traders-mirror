import React from 'react';
import styles from './FibLevelModal.module.css';
import { Button } from '@/presentation/shared/components/Button/Button';
import { TagToggle } from '@/presentation/shared/components/TagToggle/TagToggle';
import { ALLOWED_FIB_LEVELS } from '@/domain/trade/valueObjects/FibLevel';

export type FibLevelModalProps = {
  open: boolean;
  selectedFibLevel: string | null;
  onChange: (fibLevel: string | null) => void;
  onClose: () => void;
  onConfirm?: () => void;
};

const FIB_LEVELS = ALLOWED_FIB_LEVELS.slice() as readonly string[];

export function FibLevelModal({ open, selectedFibLevel, onChange, onClose }: FibLevelModalProps) {
  const [internalSelection, setInternalSelection] = React.useState<string | null>(selectedFibLevel);
  React.useEffect(() => {
    if (open) setInternalSelection(selectedFibLevel);
  }, [open, selectedFibLevel]);
  if (!open) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>SK Entry wählen</h2>
        <div className={styles.chipRow}>
          {FIB_LEVELS.map((fib) => (
            <TagToggle
              key={fib}
              label={fib}
              checked={internalSelection === fib}
              onChange={() => setInternalSelection(fib)}
            />
          ))}
        </div>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Schließen
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              onChange(internalSelection);
              onClose();
            }}
            disabled={!internalSelection}
            style={{ marginLeft: 8 }}
          >
            Bestätigen
          </Button>
        </div>
      </div>
    </div>
  );
}
