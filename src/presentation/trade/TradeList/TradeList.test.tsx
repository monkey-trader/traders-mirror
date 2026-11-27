import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, afterEach, describe, it, expect } from 'vitest';
import { TradeList, type TradeListItem } from './TradeList';

afterEach(() => {
  vi.restoreAllMocks();
});

const sampleTrade = (overrides: Partial<TradeListItem> = {}): TradeListItem => ({
  id: 't1',
  market: 'Crypto',
  symbol: 'ABCUSD',
  entryDate: '2025-01-01T00:00:00.000Z',
  size: 1,
  price: 1,
  side: 'LONG',
  status: 'OPEN',
  pnl: 0,
  tp1: undefined,
  tp2: undefined,
  tp3: undefined,
  tp4: undefined,
  ...overrides,
});

describe('TradeList', () => {
  it('renders values and handles click and keyboard select', () => {
    const onSelect = vi.fn();
    render(
      <TradeList
        trades={[sampleTrade({ pnl: 123.4567, tp3: 3.5, notes: 'Breakout play' })]}
        onSelect={onSelect}
      />
    );

    const item = screen.getByLabelText('Select ABCUSD');
    fireEvent.click(item);
    expect(onSelect).toHaveBeenCalledWith('t1');

    // keyboard Enter
    fireEvent.keyDown(item, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('t1');

    expect(screen.getByText('ABCUSD')).toBeDefined();
    expect(screen.getByText(/PnL/)).toHaveTextContent('PnL +123.46');
    expect(screen.getByText(/TP3: 3\.5/)).toBeTruthy();
    expect(screen.getByText('Breakout play')).toBeTruthy();
  });

  it('analysis open button sets hash and dispatches event (sync + async)', async () => {
    const trade = sampleTrade({ analysisId: 'an-123' });
    const onSelect = vi.fn();
    const dispatchSpy = vi.spyOn(globalThis, 'dispatchEvent');

    render(<TradeList trades={[trade]} onSelect={onSelect} />);

    const btn = screen.getByLabelText(`Open analysis for ${trade.symbol}`);
    // ensure initial hash is empty-ish
    globalThis.location.hash = '';
    fireEvent.click(btn);

    // hash should be set synchronously
    expect(globalThis.location.hash).toContain('#/analysis?id=an-123');

    // Wait for event dispatch (setTimeout inside component)
    await waitFor(() => expect(dispatchSpy).toHaveBeenCalled());
    const calledWith = dispatchSpy.mock.calls[0][0];
    expect(calledWith.type).toBe('open-analysis');
    // @ts-expect-error - CustomEvent typing may be narrower in TS lib
    expect(calledWith.detail?.id).toBe('an-123');
  });

  it('compact view exposes data attribute and TP placeholders', () => {
    const trade = sampleTrade({
      market: 'Forex',
      tp1: undefined,
      tp2: undefined,
      tp3: 3,
      tp4: undefined,
      analysisId: 'an-x',
    });
    const onSelect = vi.fn();
    render(<TradeList trades={[trade]} onSelect={onSelect} compactView />);

    const list = screen.getByRole('list');
    expect(list.getAttribute('data-compact')).toBe('true');

    // TP1 placeholder
    expect(screen.getByText('TP1: \u2013')).toBeTruthy();
    // TP3 should show the number
    expect(screen.getByText(/TP3: 3/)).toBeTruthy();
    // Analysis open button exists
    expect(screen.getByLabelText(`Open analysis for ${trade.symbol}`)).toBeTruthy();
  });

  it('renders LONG and SHORT badges with normalized data attributes', () => {
    const trades: TradeListItem[] = [
      {
        id: '1',
        market: 'Crypto',
        symbol: 'BTCUSD',
        entryDate: '2025-01-01T00:00:00Z',
        size: 1,
        price: 10000,
        side: 'LONG',
        status: 'OPEN',
        pnl: 0,
      },
      {
        id: '2',
        market: 'Forex',
        symbol: 'ETHUSD',
        entryDate: '2025-01-02T00:00:00Z',
        size: 2,
        price: 2000,
        side: 'SELL',
        status: 'FILLED',
        pnl: -10,
      },
    ];

    render(<TradeList trades={trades} onSelect={() => {}} />);

    // Check normalized labels
    expect(screen.getByText('LONG')).toBeDefined();
    expect(screen.getByText('SHORT')).toBeDefined();

    // Check that badge elements exist and have the side class applied
    const longBadge = screen.getByText('LONG');
    const shortBadge = screen.getByText('SHORT');

    expect(longBadge?.getAttribute('data-side')).toBe('LONG');
    expect(shortBadge?.getAttribute('data-side')).toBe('SHORT');

    const statusFilled = screen.getByText('FILLED');
    expect(statusFilled?.getAttribute('data-status')).toBe('FILLED');
  });

  it('clicking analysis loupe sets hash and dispatches open-analysis (userEvent)', async () => {
    const user = userEvent.setup();
    const withAnalysis: TradeListItem[] = [
      {
        id: 'a1',
        symbol: 'USDCHF',
        entryDate: '2025-01-02T00:00:00.000Z',
        size: 1,
        price: 1,
        side: 'LONG',
        analysisId: 'analysis-a1',
      },
    ];

    const spy = vi.spyOn(globalThis, 'dispatchEvent');
    render(<TradeList trades={withAnalysis} onSelect={() => {}} />);

    const button = screen.getByRole('button', { name: /Open analysis for USDCHF/i });
    await user.click(button);

    expect(globalThis.location.hash).toContain('#/analysis?id=analysis-a1');
    await waitFor(() => expect(spy).toHaveBeenCalled());
    spy.mockRestore();
  });

  it('renders inline action dropdown and forwards selection to onAction', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onAction = vi.fn();
    render(<TradeList trades={[sampleTrade()]} onSelect={onSelect} onAction={onAction} />);

    const trigger = screen.getByRole('button', { name: /Open actions for/i });
    await user.click(trigger);

    const menuItem = await screen.findByRole('menuitem', { name: /Toggle side for/i });
    await user.click(menuItem);

    expect(onAction).toHaveBeenCalledWith('toggle-side', 't1');
    expect(onSelect).not.toHaveBeenCalled();
  });
});
