import React from 'react';
import { TradeList } from '../../TradeList/TradeList';
import styles from '../../TradeJournal.module.css';
import type { TradeRow } from '../../types';
import type { FocusField } from '../../TradeList/TradeList';

type Props = {
  tradeListItems: TradeRow[];
  selectedId: string | null;
  // onSelect may optionally request a specific field (used for inline focus cues)
  onSelect: (id: string, focusField?: string) => void;
  performAction: (
    action:
      | 'toggle-side'
      | 'sl-be'
      | 'sl-hit'
      | 'close'
      | 'delete'
      | 'status-open'
      | 'status-closed',
    id: string
  ) => void;
  performTPHit: (id: string, tpIndex: 1 | 2 | 3 | 4) => void;
  compactGrid: boolean;
  onInlineUpdate?: (id: string, field: FocusField, value: number | string | undefined) => void;
  onRequestDelete?: (id: string) => void;
  onRequestEdit?: (id: string) => void;
};

export function TradesPanel({
  tradeListItems,
  selectedId,
  onSelect,
  performAction,
  performTPHit,
  compactGrid,
  onInlineUpdate,
  onRequestDelete,
  onRequestEdit,
}: Props) {
  return (
    <div className={styles.leftPane}>
      <TradeList
        trades={tradeListItems}
        selectedId={selectedId}
        onSelect={onSelect}
        onToggleSide={(id) => performAction('toggle-side', id)}
        onSetSLtoBE={(id) => performAction('sl-be', id)}
        onSetSLHit={(id) => performAction('sl-hit', id)}
        onMarkClosed={(id) => performAction('status-closed', id)}
        onMarkOpen={(id) => performAction('status-open', id)}
        onClose={(id) => performAction('close', id)}
        onSetTPHit={(id, idx) => performTPHit(id, idx)}
        onInlineUpdate={onInlineUpdate}
        onDelete={onRequestDelete}
        onEdit={onRequestEdit}
        compactView={compactGrid}
      />
    </div>
  );
}

export default TradesPanel;
