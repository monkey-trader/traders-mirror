import { renderHook, act, waitFor } from '@testing-library/react';
import { useTradesViewModel } from './useTradesViewModel';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';
import { TradeService } from '@/application/trade/services/TradeService';
import { InMemoryTradeRepository } from '@/infrastructure/trade/repositories/InMemoryTradeRepository';
import type { TradeRow } from '@/presentation/trade/types';
import type { MutableRefObject } from 'react';

describe('useTradesViewModel', () => {
  let repo: InMemoryTradeRepository;
  let repoRef: MutableRefObject<InMemoryTradeRepository | null>;
  let tradeService: TradeService;

  function makeTradeRow(overrides: Partial<TradeRow> = {}): TradeRow {
    const trade = TradeFactory.create({
      id: 't1',
      symbol: 'EURUSD',
      entryDate: new Date().toISOString(),
      size: 1,
      price: 1.1,
      side: 'LONG',
      market: 'Forex',
      status: 'OPEN',
    });
    const dto = TradeFactory.toDTO(trade);
    return {
      ...dto,
      market: dto.market as 'Forex' | 'Crypto' | 'All',
      entryDate: dto.entryDate ?? new Date().toISOString(),
      pnl: 0,
      side: dto.side as 'LONG' | 'SHORT',
      status: dto.status ?? 'OPEN',
      ...overrides,
    };
  }

  beforeEach(() => {
    repo = new InMemoryTradeRepository();
    repoRef = { current: repo };
    tradeService = new TradeService(repo);
  });

  it('initializes with empty positions', () => {
    const { result } = renderHook(() => useTradesViewModel({ repoRef, tradeService }));
    expect(result.current.positions).toEqual([]);
  });

  it('can update a trade by id', async () => {
    const row = makeTradeRow();
    const { result } = renderHook(() => useTradesViewModel({ repoRef, tradeService }));
    act(() => {
      result.current.setPositions([row]);
      result.current.updateTradeById(row.id, { price: 1.2 });
    });
    expect(result.current.positions[0].price).toBe(1.2);
  });

  it('can perform toggle-side action', async () => {
    const row = makeTradeRow({ side: 'LONG' });
    const { result } = renderHook(() => useTradesViewModel({ repoRef, tradeService }));
    await act(async () => {
      result.current.setPositions([row]);
      result.current.performAction('toggle-side', row.id);
    });
    // Diagnostic log to inspect immediate state after action
    // eslint-disable-next-line no-console
    console.log('DIAG: immediate side after performAction:', result.current.positions[0]?.side);
    await waitFor(() => {
      expect(result.current.positions[0].side).toBe('SHORT');
    });
  });

  it('performTPHit marks trade as CLOSED', async () => {
    const row = makeTradeRow({ status: 'OPEN' });
    const { result } = renderHook(() => useTradesViewModel({ repoRef, tradeService }));
    await act(async () => {
      result.current.setPositions([row]);
      result.current.performTPHit(row.id, 2);
    });
    expect(result.current.positions[0].status).toBe('CLOSED');
    expect(result.current.positions[0].tp2IsHit).toBe(true);
  });

  it('performTPHit clears an existing TP flag', async () => {
    const row = makeTradeRow({ status: 'CLOSED', tp3IsHit: true });
    const { result } = renderHook(() => useTradesViewModel({ repoRef, tradeService }));
    await act(async () => {
      result.current.setPositions([row]);
      result.current.performTPHit(row.id, 3);
    });
    expect(result.current.positions[0].tp3IsHit).toBeUndefined();
    expect(result.current.positions[0].status).toBe('CLOSED');
  });

  it('handleInlineUpdate updates numeric fields', () => {
    const row = makeTradeRow({ price: 1.1 });
    const { result } = renderHook(() => useTradesViewModel({ repoRef, tradeService }));
    act(() => {
      result.current.setPositions([row]);
      result.current.handleInlineUpdate(row.id, 'price', 2.5);
    });
    expect(result.current.positions[0].price).toBe(2.5);
  });

  it('can clear undo info', () => {
    const row = makeTradeRow();
    const { result } = renderHook(() => useTradesViewModel({ repoRef, tradeService }));
    act(() => {
      result.current.setPositions([row]);
      // Simulate undo info
      result.current.undoInfo = { id: row.id, prev: row };
      result.current.clearUndo();
    });
    expect(result.current.undoInfo).toBeNull();
  });

  it('handles missing repo gracefully', () => {
    const repoRefNull = { current: null };
    const { result } = renderHook(() => useTradesViewModel({ repoRef: repoRefNull }));
    act(() => {
      result.current.updateTradeById('fake-id', { price: 1.2 });
    });
    expect(result.current.positions.length).toBe(1);
  });
});
