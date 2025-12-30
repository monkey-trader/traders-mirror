import React from 'react';
import { Button } from '@/presentation/shared/components/Button/Button';
import { TradeList } from '../../TradeList/TradeList';
import { TradeDetailEditor } from '../../TradeDetail/TradeDetailEditor';
import styles from '../../TradeJournal.module.css';
import type { TradeRow } from '../../types';
import type { TradeInput } from '@/domain/trade/factories/TradeFactory';

type Props = {
  tradeListItems: TradeRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  performAction: (
    action: 'toggle-side' | 'sl-be' | 'sl-hit' | 'close' | 'delete',
    id: string
  ) => void;
  compactGrid: boolean;
  compactEditorOpen: boolean;
  setCompactEditorOpen: (v: boolean) => void;
  selectedTrade: TradeRow | null;
  onEditorChange: (dto: TradeInput) => void;
  onEditorSave: (dto: {
    id: string;
    symbol: string;
    entryDate?: string;
    size: number;
    price: number;
    side: string;
    notes?: string;
    status?: 'OPEN' | 'CLOSED' | 'FILLED';
  }) => Promise<void>;
  onDeleteFromEditor: (id: string) => Promise<void>;
};

export function TradesPanel({
  tradeListItems,
  selectedId,
  onSelect,
  performAction,
  compactGrid,
  compactEditorOpen,
  setCompactEditorOpen,
  selectedTrade,
  onEditorChange,
  onEditorSave,
  onDeleteFromEditor,
}: Props) {
  // Return only the inner panes — the parent should render the outer .listAndDetailWrap
  return (
    <>
      {compactGrid ? (
        <div className={styles.leftPane}>
          <TradeList
            trades={tradeListItems}
            selectedId={selectedId}
            onSelect={onSelect}
            onToggleSide={(id) => performAction('toggle-side', id)}
            onSetSLtoBE={(id) => performAction('sl-be', id)}
            onSetSLHit={(id) => performAction('sl-hit', id)}
            onClose={(id) => performAction('close', id)}
            compactView={compactGrid}
          />
          <div className={styles.spacer12} />
          {selectedTrade ? (
            compactEditorOpen ? (
              <div>
                <div className={styles.compactControls}>
                  <Button variant="ghost" onClick={() => setCompactEditorOpen(false)}>
                    Hide details
                  </Button>
                </div>
                <TradeDetailEditor
                  trade={selectedTrade}
                  onChange={onEditorChange}
                  onSave={onEditorSave}
                  onDelete={onDeleteFromEditor}
                  compactView={compactGrid}
                />
              </div>
            ) : (
              <div className={styles.compactSummary} role="region" aria-live="polite">
                <div className={styles.compactSummaryInner}>
                  <div>
                    <div className={styles.strong}>{selectedTrade.symbol}</div>
                    <div className={styles.mutedSmall}>
                      {new Date(selectedTrade.entryDate).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <Button variant="primary" onClick={() => setCompactEditorOpen(true)}>
                      Show details
                    </Button>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className={styles.compactPlaceholder} role="region" aria-live="polite">
              <div className={styles.compactPlaceholderTitle}>Keine Auswahl</div>
              <div className={styles.mutedText}>
                Wähle einen Trade in der Liste, um die Details zu bearbeiten.
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className={styles.leftPane}>
            <TradeList
              trades={tradeListItems}
              selectedId={selectedId}
              onSelect={onSelect}
              onToggleSide={(id) => performAction('toggle-side', id)}
              onSetSLtoBE={(id) => performAction('sl-be', id)}
              onSetSLHit={(id) => performAction('sl-hit', id)}
              onClose={(id) => performAction('close', id)}
              compactView={compactGrid}
            />
          </div>

          <div className={styles.rightPane}>
            <TradeDetailEditor
              trade={selectedTrade}
              onChange={onEditorChange}
              onSave={onEditorSave}
              onDelete={onDeleteFromEditor}
            />
          </div>
        </>
      )}
    </>
  );
}

export default TradesPanel;
