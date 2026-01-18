import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, afterEach, describe, it, expect } from 'vitest';
import { TradeList, type TradeListItem } from './TradeList';

vi.mock('@/presentation/shared/components/IconButton/IconButton', () => ({
  IconButton: (props: {
    ariaLabel?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    title?: string;
    icon?: React.ReactNode;
  }) => (
    <button aria-label={props.ariaLabel} onClick={props.onClick} title={props.title}>
      {props.icon ? 'icon' : 'btn'}
    </button>
  ),
}));

vi.mock('@/presentation/shared/components/PositionCard/PositionCard', () => ({
  PositionCard: (props: { id: string; symbol: string; onExpand?: (id: string) => void }) => (
    <button data-testid={`pos-${props.id}`} onClick={() => props.onExpand?.(props.id)}>
      {props.symbol}
    </button>
  ),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

const sampleTrade = (overrides: Partial<TradeListItem> = {}): TradeListItem => ({
  id: 't1',
  symbol: 'ABCUSD',
  entryDate: '2025-01-01T00:00:00.000Z',
  size: 1,
  price: 1,
  side: 'buy',
  status: 'OPEN',
  ...overrides,
});

describe('TradeList', () => {
  it('renders items and handles click and keyboard select', () => {
    const onSelect = vi.fn();
    render(<TradeList trades={[sampleTrade()]} onSelect={onSelect} />);

    const item = screen.getByLabelText('Select ABCUSD');
    fireEvent.click(item);
    expect(onSelect).toHaveBeenCalledWith('t1');

    // keyboard Enter
    fireEvent.keyDown(item, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('t1');
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

  it('compact view shows TP placeholders and analysis button', () => {
    const trade = sampleTrade({
      tp1: undefined,
      tp2: undefined,
      tp3: 3,
      tp4: undefined,
      analysisId: 'an-x',
    });
    const onSelect = vi.fn();
    render(<TradeList trades={[trade]} onSelect={onSelect} compactView />);

    const tp1Metric = screen.getByRole('button', { name: 'Edit TP1' });
    expect(tp1Metric).toBeTruthy();
    expect(tp1Metric.textContent).toContain('TP1');
    expect(tp1Metric.textContent).toContain('-');

    const tp3Metric = screen.getByRole('button', { name: 'Edit TP3' });
    expect(tp3Metric.textContent).toContain('3.00');
    // Analysis open button exists
    expect(screen.getByLabelText(`Open analysis for ${trade.symbol}`)).toBeTruthy();
  });

  it('metric tiles trigger focusable selection when clicked', () => {
    const onSelect = vi.fn();
    const trade = sampleTrade({ id: 'metric-1', price: 94652.1234, size: 20 });
    render(<TradeList trades={[trade]} onSelect={onSelect} />);

    const entryMetric = screen.getByRole('button', { name: 'Edit Entry' });
    fireEvent.click(entryMetric);

    expect(onSelect).toHaveBeenCalledWith('metric-1', 'price');
  });

  it('renders LONG and SHORT badges with normalized labels and classes', () => {
    const trades: TradeListItem[] = [
      {
        id: '1',
        symbol: 'BTCUSD',
        entryDate: '2025-01-01T00:00:00Z',
        size: 1,
        price: 10000,
        side: 'LONG',
      },
      {
        id: '2',
        symbol: 'ETHUSD',
        entryDate: '2025-01-02T00:00:00Z',
        size: 2,
        price: 2000,
        side: 'SELL',
      },
    ];

    render(<TradeList trades={trades} onSelect={() => {}} />);

    // Check normalized labels
    expect(screen.getByText('LONG')).toBeDefined();
    expect(screen.getByText('SHORT')).toBeDefined();

    // Check that badge elements exist and have the side class applied
    const longBadge = screen.getByText('LONG').closest('div');
    const shortBadge = screen.getByText('SHORT').closest('div');

    expect(longBadge).toBeDefined();
    expect(shortBadge).toBeDefined();

    // className checks (module CSS transforms to generated names; basic check for substring)
    expect(longBadge?.className).toMatch(/sideLong/);
    expect(shortBadge?.className).toMatch(/sideShort/);
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
});
