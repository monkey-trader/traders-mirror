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
          // If SL is explicitly patched by the UI, clear any previous SL-BE flag
          if (normalizedPatch.sl !== undefined) {
            normalizedPatch.slIsBE = undefined;
          }
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
              const sanitized: TradeInput = { ...restored } as unknown as TradeInput;
              if (sanitized.sl === 0) delete (sanitized as Partial<TradeInput>).sl;
              const domain = TradeFactory.create(sanitized as unknown as TradeInput);
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
        // Set SL to break-even. Persist `slIsBE=true` and clear numeric SL in the UI
        // so the input does not show `0` as a sentinel value.
        updateTradeById(id, { sl: undefined, slIsBE: true });
        // Also persist immediately via repository/service to ensure storage reflects the change.
        (async () => {
          try {
            const updated = positionsRef.current.find((p) => p.id === id);
            if (!updated) return;
            const sanitized: TradeInput = {
              id: updated.id,
              symbol: updated.symbol,
              entryDate: updated.entryDate,
              size: updated.size,
              price: updated.price,
              side: updated.side,
              status: updated.status,
              userId: updated.userId,
              notes: updated.notes,
              tp1: updated.tp1,
              tp2: updated.tp2,
              tp3: updated.tp3,
              tp4: updated.tp4,
              sl: updated.sl,
              slIsBE: updated.slIsBE,
              leverage: updated.leverage,
              margin: updated.margin,
              market: updated.market,
            };
            // convert UI sentinel (sl === 0) to explicit BE flag
            if ((sanitized as Partial<TradeInput>).sl === 0) {
              (sanitized as Partial<TradeInput>).slIsBE = true;
              delete (sanitized as Partial<TradeInput>).sl;
            }
            const domain = TradeFactory.create(sanitized as unknown as TradeInput);
            if (serviceRef.current) await serviceRef.current.update(domain as unknown as Trade);
            else if (repoRef.current) await repoRef.current.update(domain as unknown as Trade);
            setLastStatus?.('SL set to BE and persisted');
            // Notify listeners (e.g. TradeJournal) to reload from repo so server-side
            // derived fields like `side` are refreshed in the UI.
            try {
              globalThis.dispatchEvent(new CustomEvent('trades-updated'));
            } catch {
              // ignore if dispatch not available
            }
          } catch (err) {
            console.error('Failed to persist SL-BE change', err);
            setLastStatus?.('SL-BE persist failed');
          }
        })();
      } else if (action === 'status-open') {
        updateTradeById(id, { status: 'OPEN' });
        (async () => {
          try {
            const updated = positionsRef.current.find((p) => p.id === id);
            if (!updated) return;
            const sanitized: TradeInput = {
              id: updated.id,
              symbol: updated.symbol,
              entryDate: updated.entryDate,
              size: updated.size,
              price: updated.price,
              side: updated.side,
              status: updated.status,
              userId: updated.userId,
              notes: updated.notes,
              tp1: updated.tp1,
              tp2: updated.tp2,
              tp3: updated.tp3,
              tp4: updated.tp4,
              sl: updated.sl,
              slIsBE: updated.slIsBE,
              leverage: updated.leverage,
              margin: updated.margin,
              market: updated.market,
            };
            const domain = TradeFactory.create(sanitized as unknown as TradeInput);
            if (serviceRef.current) await serviceRef.current.update(domain as unknown as Trade);
            else if (repoRef.current) await repoRef.current.update(domain as unknown as Trade);
            setLastStatus?.('Open persisted');
          } catch (err) {
            console.error('Failed to persist open change', err);
            setLastStatus?.('Open persist failed');
          }
        })();
      } else if (action === 'sl-hit' || action === 'status-closed') {
        // Mark as CLOSED and persist immediately so refresh shows new state
        updateTradeById(id, { status: 'CLOSED' });
        (async () => {
          try {
            const updated = positionsRef.current.find((p) => p.id === id);
            if (!updated) return;
            const sanitized: TradeInput = {
              id: updated.id,
              symbol: updated.symbol,
              entryDate: updated.entryDate,
              size: updated.size,
              price: updated.price,
              side: updated.side,
              status: updated.status,
              userId: updated.userId,
              notes: updated.notes,
              tp1: updated.tp1,
              tp2: updated.tp2,
              tp3: updated.tp3,
              tp4: updated.tp4,
              sl: updated.sl,
              slIsBE: updated.slIsBE,
              leverage: updated.leverage,
              margin: updated.margin,
              market: updated.market,
            };
            const domain = TradeFactory.create(sanitized as unknown as TradeInput);
            if (serviceRef.current) await serviceRef.current.update(domain as unknown as Trade);
            else if (repoRef.current) await repoRef.current.update(domain as unknown as Trade);
            setLastStatus?.('Closed persisted');
          } catch (err) {
            console.error('Failed to persist closed change', err);
            setLastStatus?.('Closed persist failed');
          }
        })();
      } else if (action === 'close') {
        // Mark as FILLED and persist immediately so refresh shows new state
        updateTradeById(id, { status: 'FILLED' });
        (async () => {
          try {
            const updated = positionsRef.current.find((p) => p.id === id);
            if (!updated) return;
            const sanitized: TradeInput = {
              id: updated.id,
              symbol: updated.symbol,
              entryDate: updated.entryDate,
              size: updated.size,
              price: updated.price,
              side: updated.side,
              status: updated.status,
              userId: updated.userId,
              notes: updated.notes,
              tp1: updated.tp1,
              tp2: updated.tp2,
              tp3: updated.tp3,
              tp4: updated.tp4,
              sl: updated.sl,
              slIsBE: updated.slIsBE,
              leverage: updated.leverage,
              margin: updated.margin,
              market: updated.market,
            };
            const domain = TradeFactory.create(sanitized as unknown as TradeInput);
            if (serviceRef.current) await serviceRef.current.update(domain as unknown as Trade);
            else if (repoRef.current) await repoRef.current.update(domain as unknown as Trade);
            setLastStatus?.('Filled persisted');
          } catch (err) {
            console.error('Failed to persist filled change', err);
            setLastStatus?.('Filled persist failed');
          }
        })();
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
        void tpIndex;
        const prev = positionsRef.current.find((p) => p.id === id) ?? positions.find((p) => p.id === id);
        if (!prev) return;
        const prevCopy = { ...prev };
        // Mark as closed on TP hit and persist immediately
        updateTradeById(id, { status: 'CLOSED' });
        (async () => {
          try {
            const updated = positionsRef.current.find((p) => p.id === id);
            if (!updated) return;
            const sanitized: TradeInput = {
              id: updated.id,
              symbol: updated.symbol,
              entryDate: updated.entryDate,
              size: updated.size,
              price: updated.price,
              side: updated.side,
              status: updated.status,
              notes: updated.notes,
              tp1: updated.tp1,
              tp2: updated.tp2,
              tp3: updated.tp3,
              tp4: updated.tp4,
              sl: updated.sl,
              slIsBE: updated.slIsBE,
              leverage: updated.leverage,
              margin: updated.margin,
              market: updated.market,
            };
            const domain = TradeFactory.create(sanitized as unknown as TradeInput);
            if (serviceRef.current) await serviceRef.current.update(domain as unknown as Trade);
            else if (repoRef.current) await repoRef.current.update(domain as unknown as Trade);
            setLastStatus?.('TP hit persisted');
          } catch (err) {
            console.error('Failed to persist TP hit change', err);
            setLastStatus?.('TP hit persist failed');
          }
        })();
        setUndoInfo({ id, prev: prevCopy });
        if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
        undoTimerRef.current = window.setTimeout(() => {
          setUndoInfo(null);
          undoTimerRef.current = null;
        }, 5000) as unknown as number;
      },
      [positions, updateTradeById]
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
              // If the user edited SL in the editor, clear slIsBE so we don't persist BE sentinel
              sl: dto.sl ?? p.sl,
              slIsBE: dto.sl !== undefined ? undefined : p.slIsBE,
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
        const ut = updatedTrade as TradeRow;
        const sanitizedForSave: TradeInput = {
          id: ut.id,
          symbol: ut.symbol,
          entryDate: ut.entryDate,
          size: ut.size,
          price: ut.price,
          side: ut.side,
          status: ut.status,
          userId: ut.userId,
          notes: ut.notes,
          tp1: ut.tp1,
          tp2: ut.tp2,
          tp3: ut.tp3,
          tp4: ut.tp4,
          sl: ut.sl,
          slIsBE: ut.slIsBE,
          leverage: ut.leverage,
          margin: ut.margin,
          market: ut.market,
        };
        if (sanitizedForSave.sl === 0) {
          sanitizedForSave.slIsBE = true;
          sanitizedForSave.sl = undefined;
        }
        const domain = TradeFactory.create(sanitizedForSave);
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
    performTPHit,
    handleEditorChange,
    handleEditorSave,
    handleDeleteFromEditor,
    undoInfo,
    handleUndo,
    clearUndo,
  };
}
