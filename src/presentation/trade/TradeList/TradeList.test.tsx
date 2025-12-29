import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TradeList, type TradeListItem } from './TradeList';

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

describe('TradeList', () => {
  it('renders LONG and SHORT badges with normalized labels and classes', () => {
    render(<TradeList trades={trades} onSelect={() => {}} />);

    // Check normalized labels
    expect(screen.getByText('LONG')).toBeDefined();
    expect(screen.getByText('SHORT')).toBeDefined();

    // Check that badge elements exist and have the side class applied
    const longBadge = screen.getByText('LONG').closest('div');
    const shortBadge = screen.getByText('SHORT').closest('div');

    expect(longBadge).toBeDefined();
    expect(shortBadge).toBeDefined();

    // className checks
    expect(longBadge?.className).toMatch(/sideLong/);
    expect(shortBadge?.className).toMatch(/sideShort/);
  });

  it('renders PositionCard components in compactView', () => {
    render(<TradeList trades={trades} onSelect={() => {}} compactView />);

    // PositionCard renders symbol text
    expect(screen.getByText('BTCUSD')).toBeDefined();
    expect(screen.getByText('ETHUSD')).toBeDefined();
  });
});
