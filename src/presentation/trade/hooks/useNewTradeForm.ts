/* eslint-disable no-console */
import React, { useCallback, useState } from 'react';
import { EntryDate } from '@/domain/trade/valueObjects/EntryDate';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';
import { validateNewTrade } from '@/presentation/trade/validation';
import type { TradeInput } from '@/domain/trade/factories/TradeFactory';
import type { TradeRow } from '@/presentation/trade/types';
import type { MarketValue } from '@/presentation/shared/components/MarketSelect/MarketSelect';
import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository';
import type { Trade } from '@/domain/trade/entities/Trade';
import { TradeId } from '@/domain/trade/valueObjects/TradeId';
import { AnalysisId } from '@/domain/trade/valueObjects/AnalysisId';
import type { ConfluenceOption } from '@/presentation/trade/components/ConfluenceModal';

export type NewTradeFormState = {
  symbol: string;
  entryDate: string;
  // match the NewTradeForm component API: numbers or undefined
  size?: number;
  price?: number;
  side: 'LONG' | 'SHORT';
  status: 'OPEN' | 'CLOSED' | 'FILLED';
  market: MarketValue | '';
  notes?: string;
  analysisId?: string | undefined;
  fibLevel?: string | null;
  sl?: number;
  tp1?: number;
  tp2?: number;
  tp3?: number;
  tp4?: number;
  margin?: number;
  leverage?: number;
  confluence?: ConfluenceOption[];
};

export function useNewTradeForm(options: {
  repoRef: React.MutableRefObject<TradeRepository | null>;
  setPositions: React.Dispatch<React.SetStateAction<TradeRow[]>>;
  analysisService?: {
    linkTradeToAnalysis?: (analysisId: string, tradeId: string) => Promise<{ backlink: string }>;
  };
  newTradeModalOpen?: boolean;
  setNewTradeModalOpen?: (v: boolean) => void;
  setLastStatus?: (s: string | null) => void;
}) {
  const {
    repoRef,
    setPositions,
    analysisService,
    newTradeModalOpen,
    setNewTradeModalOpen,
    setLastStatus,
  } = options;

  const [form, setForm] = useState<NewTradeFormState>({
    symbol: '',
    entryDate: EntryDate.toInputValue(),
    size: undefined,
    price: undefined,
    side: 'LONG',
    status: 'OPEN',
    market: 'Crypto',
    notes: '',
    analysisId: undefined,
    fibLevel: undefined,
    confluence: [],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const parseNumberField = useCallback((v: unknown): number | undefined => {
    if (v === undefined || v === null) return undefined;
    if (typeof v === 'number') return v;
    try {
      const s = String(v).trim();
      if (s.length === 0) return undefined;
      const n = Number(s);
      return Number.isNaN(n) ? undefined : n;
    } catch {
      return undefined;
    }
  }, []);

  const resetNewTradeForm = useCallback(() => {
    setForm({
      symbol: '',
      entryDate: EntryDate.toInputValue(),
      size: undefined,
      price: undefined,
      side: 'LONG',
      status: 'OPEN',
      market: 'Crypto',
      notes: '',
      sl: undefined,
      tp1: undefined,
      tp2: undefined,
      tp3: undefined,
      tp4: undefined,
      leverage: undefined,
      margin: undefined,
      analysisId: undefined,
      fibLevel: undefined,
      confluence: [],
    });
    setFormErrors({});
    setTouched({});
    setFormSubmitted(false);
    setFormKey((k) => k + 1);
  }, []);

  const handleAdd = useCallback(
    async (e?: React.FormEvent) => {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      setFormSubmitted(true);
      setLastStatus?.('handleAdd start');

      const toValidate = {
        symbol: form.symbol,
        entryDate: form.entryDate,
        size: parseNumberField(form.size) ?? undefined,
        price: parseNumberField(form.price) ?? undefined,
        side: form.side as string,
        market: (form.market ?? '') as MarketValue,
        sl: form.sl,
        margin: form.margin,
        leverage: form.leverage,
      };

      const validation = validateNewTrade(
        toValidate as unknown as import('@/presentation/trade/validation').TradeForm
      );
      const mapped: Record<string, string> = {};
      validation.forEach((v) => {
        if (v && v.field) mapped[v.field] = v.message;
      });
      if (Object.keys(mapped).length > 0) {
        setFormErrors(mapped);
        setLastStatus?.(`validation failed: ${Object.keys(mapped).join(',')}`);
        setTouched((prev) => ({
          ...prev,
          ...Object.fromEntries(Object.keys(mapped).map((k) => [k, true])),
        }));
        return;
      }

      const newTrade: TradeRow = {
        id: TradeId.generate(),
        symbol: form.symbol,
        entryDate: form.entryDate,
        size: Number(form.size),
        price: Number(form.price),
        side: form.side as 'LONG' | 'SHORT',
        notes: form.notes || undefined,
        market: (form.market as Exclude<MarketValue, ''>) || 'Crypto',
        sl: form.sl,
        tp1: form.tp1,
        tp2: form.tp2,
        tp3: form.tp3,
        tp4: form.tp4,
        margin: form.margin,
        leverage: form.leverage,
        status: form.status,
        pnl: 0,
        ...(form.analysisId ? { analysisId: new AnalysisId(form.analysisId).value } : {}),
        ...(form.fibLevel ? { entry: form.fibLevel } : {}),
        ...(form.confluence && form.confluence.length > 0 ? { confluence: form.confluence } : {}),
      } as TradeRow;

      try {
        if (!repoRef.current) {
          setLastStatus?.('repo unavailable; local update');
          setPositions((prev) => [newTrade, ...prev]);
        } else {
          setLastStatus?.(`persisting ${newTrade.id}`);
          const domain = TradeFactory.create(newTrade as unknown as TradeInput);

          // call repo methods with typed repo
          const repo = repoRef.current;
          if (repo) {
            if (typeof repo.save === 'function') await repo.save(domain as unknown as Trade);
          }
          setLastStatus?.(`persisted ${newTrade.id}`);

          if (form.analysisId && analysisService?.linkTradeToAnalysis) {
            try {
              const normalizedAnalysisId = new AnalysisId(form.analysisId).value;
              const link = await analysisService.linkTradeToAnalysis(
                normalizedAnalysisId,
                newTrade.id
              );
              const backlink = link.backlink;
              const updatedNotes = `${
                newTrade.notes ? newTrade.notes + '\n' : ''
              }Linked to analysis: ${backlink}`;
              const updatedDomain = TradeFactory.create({
                ...(newTrade as unknown as TradeInput),
                notes: updatedNotes,
                analysisId: normalizedAnalysisId,
              });
              if (repo && typeof repo.update === 'function')
                await repo.update(updatedDomain as unknown as Trade);
              setPositions((prev) => [{ ...newTrade, notes: updatedNotes }, ...prev]);
            } catch (linkErr) {
              // ignore link errors
              console.warn('failed to create analysis backlink', linkErr);
            }
          }

          try {
            if (repo && typeof repo.getAll === 'function') {
              const domainTrades = await repo.getAll();
              const dtoTrades = domainTrades.map(
                (dt) => TradeFactory.toDTO(dt) as unknown as TradeRow
              );
              setPositions(dtoTrades);
              setLastStatus?.(`reloaded ${dtoTrades.length} trades from repo`);
            }
          } catch {
            setLastStatus?.('reload failed; fallback to local');
            setPositions((prev) => [newTrade, ...prev]);
          }
        }

        setLastStatus?.('Saved');
        if (newTradeModalOpen && typeof setNewTradeModalOpen === 'function')
          setNewTradeModalOpen(false);

        resetNewTradeForm();
      } catch {
        setLastStatus?.('persist error');
        setPositions((prev) => [newTrade, ...prev]);
      }

      setFormErrors({});
      setFormSubmitted(false);
      setTouched({});
    },
    [
      form,
      parseNumberField,
      repoRef,
      setPositions,
      resetNewTradeForm,
      analysisService,
      newTradeModalOpen,
      setNewTradeModalOpen,
      setLastStatus,
    ]
  );

  return {
    form,
    setForm,
    formErrors,
    setFormErrors,
    touched,
    setTouched,
    formSubmitted,
    setFormSubmitted,
    formKey,
    handleAdd,
    resetNewTradeForm,
  } as const;
}
