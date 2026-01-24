import React from 'react';
import styles from './ConfluenceModal.module.css';
import { ConfluenceWizard } from './ConfluenceWizard';

export type ConfluenceModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm?: (data: any) => void;
};

export default function ConfluenceModal({ open, onClose, onConfirm }: ConfluenceModalProps) {
  if (!open) return null;
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <ConfluenceWizard
          onConfirm={(data) => {
            // First call the optional callback
            if (typeof onConfirm === 'function') onConfirm(data);
            // Dispatch a global event so other parts of the app can react without
            // requiring a direct prop callback (keeps modal reusable)
            try {
              globalThis.dispatchEvent(
                new CustomEvent('confluence-wizard:confirmed', { detail: data })
              );
            } catch {
              /* ignore */
            }
            onClose();
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
