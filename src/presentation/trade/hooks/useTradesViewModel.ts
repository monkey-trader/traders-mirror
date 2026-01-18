/* eslint-disable no-console */
import { useCallback, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';
import type { TradeRow } from '@/presentation/trade/types';
import type { TradeInput } from '@/domain/trade/factories/TradeFactory';
import type { AnalysisService } from '@/application/analysis/services/AnalysisService';
import { TradeService } from '@/application/trade/services/TradeService';
import { toggleSide } from '@/presentation/trade/utils/tradeHelpers';
import type { Trade } from '@/domain/trade/entities/Trade';
import type { FocusField } from '@/presentation/trade/TradeList/TradeList';

type UseTradesViewModelParams = {
  repoRef: MutableRefObject<TradeRepository | null>;
  tradeService?: TradeService;
  analysisService?: AnalysisService;
  setLastStatus?: (s: string | null) => void;
};

type TpValueKey = 'tp1' | 'tp2' | 'tp3' | 'tp4';
type TpHitFlagKey = 'tp1IsHit' | 'tp2IsHit' | 'tp3IsHit' | 'tp4IsHit';

const tpValueFlagPairs: ReadonlyArray<readonly [TpValueKey, TpHitFlagKey]> = [
  ['tp1', 'tp1IsHit'],
  ['tp2', 'tp2IsHit'],
  ['tp3', 'tp3IsHit'],
  ['tp4', 'tp4IsHit'],
];

const tpHitFlagMap: Record<1 | 2 | 3 | 4, TpHitFlagKey> = {
  1: 'tp1IsHit',
  2: 'tp2IsHit',
  3: 'tp3IsHit',
  4: 'tp4IsHit',
};

export function useTradesViewModel({
  repoRef,
  tradeService,
  analysisService,
  setLastStatus,
}: UseTradesViewModelParams) {
  // reference analysisService to avoid unused param lint (it may be used later)
  void analysisService;
  // prefer provided TradeService, otherwise construct from repoRef when available
  const serviceRef = useRef<TradeService | null>(
    tradeService ?? (repoRef.current ? new TradeService(repoRef.current) : null)
  );
  const [positions, _setPositions] = useState<TradeRow[]>([]);
  const positionsRef = useRef<TradeRow[]>([]);

  const setPositions = useCallback((value: TradeRow[] | ((prev: TradeRow[]) => TradeRow[])) => {
    if (typeof value === 'function') {
      _setPositions((prev) => {
        const next = (value as (prev: TradeRow[]) => TradeRow[])(prev);
        positionsRef.current = next;
        return next;
      });
    } else {
      positionsRef.current = value;
      _setPositions(value);
    }
  }, []);
  const [undoInfo, setUndoInfo] = useState<{ id: string; prev: TradeRow } | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  const clearUndo = useCallback(() => {
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
    setUndoInfo(null);
  }, []);

  const updateTradeById = useCallback(
    (id: string, patch: Partial<TradeRow>, statusMessage?: string): void => {
      setPositions((prev) => {
        const existing = prev.find((p) => p.id === id);
        let next: TradeRow[];
        if (existing) {
          // Ensure side is always a primitive string
          const normalizedPatch = { ...patch };
          if (normalizedPatch.side !== undefined) {
            // If side is a value object, extract its value
            if (
              typeof normalizedPatch.side === 'object' &&
              normalizedPatch.side !== null &&
              'value' in normalizedPatch.side
            ) {
              normalizedPatch.side = (normalizedPatch.side as { value: string }).value as
                | 'LONG'
                | 'SHORT';
            }
            // Normalize to uppercase and restrict to 'LONG' or 'SHORT'
            const upper = String(normalizedPatch.side).toUpperCase();
            normalizedPatch.side = upper === 'LONG' || upper === 'SHORT' ? upper : 'LONG';
          }
          // If SL is explicitly patched by the UI, clear any previous SL-BE flag
          if (normalizedPatch.sl !== undefined) {
            normalizedPatch.slIsBE = undefined;
          }
          tpValueFlagPairs.forEach(([valueKey, flagKey]) => {
            if (normalizedPatch[valueKey] !== undefined) {
              normalizedPatch[flagKey] = undefined;
            }
          });
          next = prev.map((p) => (p.id === id ? { ...p, ...normalizedPatch } : p));
          const updated = next.find((t) => t.id === id)!;
          void (async () => {
            try {
              if (!repoRef.current) {
                console.warn('Repository unavailable');
                return;
              }
              // sanitize values that are not valid domain primitives (e.g. SL==0 is used as UI sentinel)
              const sanitized: TradeInput = { ...updated } as unknown as TradeInput;
              if (sanitized.sl === 0) delete (sanitized as Partial<TradeInput>).sl;
              const domain = TradeFactory.create(sanitized as unknown as TradeInput);
              if (serviceRef.current) await serviceRef.current.update(domain as unknown as Trade);
              else await repoRef.current.update(domain);
              setLastStatus?.(statusMessage ?? 'Update persisted');
            } catch (err) {
              console.error('Failed to persist trade update', err);
              setLastStatus?.('Update failed');
            }
          })();
        } else {
          const restored = Object.assign({}, patch as TradeRow, { id }) as TradeRow;
          next = [restored, ...prev];
          void (async () => {
            try {
              if (!repoRef.current) {
                console.warn('Repository unavailable');
                return;
              }
              const sanitized: TradeInput = { ...restored } as unknown as TradeInput;
              if (sanitized.sl === 0) delete (sanitized as Partial<TradeInput>).sl;
              const domain = TradeFactory.create(sanitized as unknown as TradeInput);
              if (serviceRef.current) await serviceRef.current.save(domain as unknown as Trade);
              else if (typeof repoRef.current.save === 'function')
                await repoRef.current.save(domain);
              else if (typeof repoRef.current.update === 'function')
                await repoRef.current.update(domain);
              setLastStatus?.(statusMessage ?? 'Restored persisted');
            } catch (err) {
              console.error('Failed to persist restored trade', err);
              setLastStatus?.('Restore failed');
            }
          })();
        }
        return next;
      });
    },
    [repoRef, setLastStatus]
  );

  const performAction = useCallback(
    (
      action:
        | 'toggle-side'
        | 'sl-be'
        | 'sl-hit'
        | 'close'
        | 'delete'
        | 'status-open'
        | 'status-closed',
      id: string
    ) => {
      const prev =
        positionsRef.current.find((p) => p.id === id) ?? positions.find((p) => p.id === id);
      if (!prev) return;
      const prevCopy = { ...prev };

      if (action === 'toggle-side') {
        const newSide = toggleSide(prev.side);
        updateTradeById(id, { side: newSide });
      } else if (action === 'sl-be') {
        updateTradeById(id, { sl: undefined, slIsBE: true }, 'SL set to BE and persisted');
        try {
          globalThis.dispatchEvent(new CustomEvent('trades-updated'));
        } catch {
          /* ignore if dispatch unavailable */
        }
      } else if (action === 'status-open') {
        updateTradeById(id, { status: 'OPEN' }, 'Open persisted');
      } else if (action === 'sl-hit' || action === 'status-closed') {
        updateTradeById(id, { status: 'CLOSED' }, 'Closed persisted');
      } else if (action === 'close') {
        updateTradeById(id, { status: 'FILLED' }, 'Filled persisted');
      } else if (action === 'delete') {
        // local removal and repo delete
        setPositions((prevs) => prevs.filter((p) => p.id !== id));
        void (async () => {
          try {
            if (serviceRef.current) await serviceRef.current.delete(id);
            else {
              if (!repoRef.current) return;
              await repoRef.current.delete(id);
            }
            setLastStatus?.('Deleted');
          } catch (err) {
            console.error('Failed to delete trade from repo', err);
            setLastStatus?.('Delete failed');
          }
        })();
        // if deleted trade was selected, caller should clear selection
      }

      setUndoInfo({ id, prev: prevCopy });
      if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = window.setTimeout(() => {
        setUndoInfo(null);
        undoTimerRef.current = null;
      }, 5000) as unknown as number;
    },
    [positions, repoRef, updateTradeById, setLastStatus]
  );

  const performTPHit = useCallback(
    (id: string, tpIndex?: 1 | 2 | 3 | 4) => {
      const prev =
        positionsRef.current.find((p) => p.id === id) ?? positions.find((p) => p.id === id);
      if (!prev) return;
      const prevCopy = { ...prev };
      const patch: Partial<TradeRow> = {};
      let statusMessage = 'TP hit persisted';

      if (tpIndex && tpHitFlagMap[tpIndex]) {
        const flagKey = tpHitFlagMap[tpIndex];
        const isCurrentlyHit = Boolean(prev[flagKey]);
        patch[flagKey] = isCurrentlyHit ? undefined : true;
        if (isCurrentlyHit) {
          statusMessage = 'TP marker cleared';
        } else {
          patch.status = 'CLOSED';
        }
      } else {
        patch.status = 'CLOSED';
      }

      updateTradeById(id, patch, statusMessage);
      setUndoInfo({ id, prev: prevCopy });
      if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = window.setTimeout(() => {
        setUndoInfo(null);
        undoTimerRef.current = null;
      }, 5000) as unknown as number;
    },
    [positions, updateTradeById]
  );

  const handleInlineUpdate = useCallback(
    (id: string, field: FocusField, value: number | string | undefined) => {
      const patch: Partial<TradeRow> = {};
      switch (field) {
        case 'price':
          patch.price = typeof value === 'number' ? value : undefined;
          break;
        case 'size':
          patch.size = typeof value === 'number' ? value : undefined;
          break;
        case 'sl':
          patch.sl = typeof value === 'number' ? value : undefined;
          patch.slIsBE = undefined;
          break;
        case 'tp1':
          patch.tp1 = typeof value === 'number' ? value : undefined;
          patch.tp1IsHit = undefined;
          break;
        case 'tp2':
          patch.tp2 = typeof value === 'number' ? value : undefined;
          patch.tp2IsHit = undefined;
          break;
        case 'tp3':
          patch.tp3 = typeof value === 'number' ? value : undefined;
          patch.tp3IsHit = undefined;
          break;
        case 'tp4':
          patch.tp4 = typeof value === 'number' ? value : undefined;
          patch.tp4IsHit = undefined;
          break;
        case 'margin':
          patch.margin = typeof value === 'number' ? value : undefined;
          break;
        case 'leverage':
          patch.leverage = typeof value === 'number' ? value : undefined;
          break;
        case 'entryDate':
          if (typeof value === 'string') patch.entryDate = value;
          break;
        default:
          break;
      }
      if (Object.keys(patch).length === 0) return;
      updateTradeById(id, patch, 'Inline edit persisted');
    },
    [updateTradeById]
  );

  const handleUndo = useCallback(() => {
    if (!undoInfo) return;
    updateTradeById(undoInfo.id, undoInfo.prev);
    clearUndo();
  }, [undoInfo, updateTradeById, clearUndo]);

  return {
    positions,
    setPositions,
    updateTradeById,
    performAction,
    performTPHit,
    handleInlineUpdate,
    undoInfo,
    handleUndo,
    clearUndo,
  };
}
