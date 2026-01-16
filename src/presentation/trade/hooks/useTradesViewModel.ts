/* eslint-disable no-console */
import { useCallback, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';
import type { TradeRow } from '@/presentation/trade/types';
import type { TradeInput } from '@/domain/trade/factories/TradeFactory';
import type { AnalysisService } from '@/application/analysis/services/AnalysisService';
import { TradeService } from '@/application/trade/services/TradeService';
import { toggleSide, chooseSlFromEntry } from '@/presentation/trade/utils/tradeHelpers';
import type { Trade } from '@/domain/trade/entities/Trade';

type UseTradesViewModelParams = {
  repoRef: MutableRefObject<TradeRepository | null>;
  tradeService?: TradeService;
  analysisService?: AnalysisService;
  setLastStatus?: (s: string | null) => void;
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
    (id: string, patch: Partial<TradeRow>): void => {
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
          next = prev.map((p) => (p.id === id ? { ...p, ...normalizedPatch } : p));
          const updated = next.find((t) => t.id === id)!;
          void (async () => {
            try {
              if (!repoRef.current) {
                console.warn('Repository unavailable');
                return;
              }
              const domain = TradeFactory.create(updated as unknown as TradeInput);
              if (serviceRef.current) await serviceRef.current.update(domain as unknown as Trade);
              else await repoRef.current.update(domain);
              setLastStatus?.('Update persisted');
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
              const domain = TradeFactory.create(restored as unknown as TradeInput);
              if (serviceRef.current) await serviceRef.current.save(domain as unknown as Trade);
              else if (typeof repoRef.current.save === 'function')
                await repoRef.current.save(domain);
              else if (typeof repoRef.current.update === 'function')
                await repoRef.current.update(domain);
              setLastStatus?.('Restored persisted');
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
    (action: 'toggle-side' | 'sl-be' | 'sl-hit' | 'close' | 'delete', id: string) => {
      const prev =
        positionsRef.current.find((p) => p.id === id) ?? positions.find((p) => p.id === id);
      if (!prev) return;
      const prevCopy = { ...prev };

      if (action === 'toggle-side') {
        const newSide = toggleSide(prev.side);
        updateTradeById(id, { side: newSide });
      } else if (action === 'sl-be') {
        // Set SL to break-even value. Per request, set SL to 0.00 (explicit zero)
        // instead of closing the trade.
        updateTradeById(id, { sl: 0 });
      } else if (action === 'sl-hit') {
        updateTradeById(id, { status: 'CLOSED' });
      } else if (action === 'close') {
        updateTradeById(id, { status: 'FILLED' });
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

  const handleEditorChange = useCallback((dto: TradeInput) => {
    setPositions((prev) =>
      prev.map((p) =>
        p.id === dto.id
          ? {
              ...p,
              symbol: dto.symbol,
              entryDate: dto.entryDate ?? p.entryDate,
              size: dto.size,
              price: dto.price,
              side: dto.side as 'LONG' | 'SHORT',
              status: dto.status ?? p.status,
              notes: dto.notes,
              tp1: dto.tp1 ?? p.tp1,
              tp2: dto.tp2 ?? p.tp2,
              tp3: dto.tp3 ?? p.tp3,
              tp4: dto.tp4 ?? p.tp4,
              sl: dto.sl ?? p.sl,
              leverage: dto.leverage ?? p.leverage,
              market:
                dto.market === 'Crypto' || dto.market === 'Forex' || dto.market === 'All'
                  ? dto.market
                  : p.market,
            }
          : p
      )
    );
  }, []);

  const handleEditorSave = useCallback(
    async (dto: TradeInput) => {
      let updatedTrade: TradeRow | null = null;
      setPositions((prev) => {
        const existing = prev.find((p) => p.id === dto.id);
        if (!existing) return prev;
        updatedTrade = {
          ...existing,
          symbol: dto.symbol,
          entryDate: dto.entryDate ?? existing.entryDate,
          size: dto.size,
          price: dto.price,
          side: dto.side as 'LONG' | 'SHORT',
          status: dto.status ?? existing.status,
          notes: dto.notes,
          tp1: dto.tp1 ?? existing.tp1,
          tp2: dto.tp2 ?? existing.tp2,
          tp3: dto.tp3 ?? existing.tp3,
          tp4: dto.tp4 ?? existing.tp4,
          sl: dto.sl ?? existing.sl,
          leverage: dto.leverage ?? existing.leverage,
          margin: dto.margin ?? existing.margin,
        };
        return prev.map((p) => (p.id === dto.id ? updatedTrade! : p));
      });

      if (!updatedTrade) {
        console.error('Save failed: trade not found', dto.id);
        return;
      }

      try {
        const domain = TradeFactory.create(updatedTrade as unknown as TradeInput);
        if (serviceRef.current) await serviceRef.current.update(domain as unknown as Trade);
        else {
          if (!repoRef.current) {
            console.warn('Repository unavailable');
            return;
          }
          await repoRef.current.update(domain);
        }
        setLastStatus?.('Saved');
      } catch (err) {
        console.error('Save failed', err);
        setLastStatus?.('Save failed');
      }
    },
    [repoRef, setLastStatus]
  );

  const handleUndo = useCallback(() => {
    if (!undoInfo) return;
    updateTradeById(undoInfo.id, undoInfo.prev);
    clearUndo();
  }, [undoInfo, updateTradeById, clearUndo]);

  const handleDeleteFromEditor = useCallback(
    async (id: string) => {
      // Caller generally shows confirm dialog; this helper deletes immediately
      try {
        setPositions((prevs) => prevs.filter((p) => p.id !== id));
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
    },
    [repoRef, setLastStatus]
  );

  return {
    positions,
    setPositions,
    updateTradeById,
    performAction,
    handleEditorChange,
    handleEditorSave,
    handleDeleteFromEditor,
    undoInfo,
    handleUndo,
    clearUndo,
  };
}
