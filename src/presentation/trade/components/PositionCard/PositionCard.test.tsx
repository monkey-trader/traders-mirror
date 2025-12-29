import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import { PositionCard } from './PositionCard';

describe('PositionCard', () => {
  it('renders symbol, side and size and shows entry + sl when provided', () => {
    render(
      <PositionCard
        id="p1"
        symbol="BTCUSD"
        side="LONG"
        size={1}
        entry="40000"
        sl="39900"
        pnl={100}
      />
    );
    const symbolEl = screen.getByText('BTCUSD');
    expect(symbolEl).toBeDefined();
    // side and size combined using middle dot - use regex to match
    const sideSize = screen.getByText(/LONG\s*[·.]\s*1/);
    expect(sideSize).toBeDefined();
    expect(screen.getByText('Entry: 40000')).toBeDefined();
    expect(screen.getByText('SL: 39900')).toBeDefined();
    expect(screen.getByText('100.00')).toBeDefined();
  });

  it('calls callbacks on button clicks', () => {
    const onExpand = vi.fn();
    const onToggleSide = vi.fn();
    const onClose = vi.fn();
    const onSetSLtoBE = vi.fn();
    const onSetSLHit = vi.fn();

    render(
      <PositionCard
        id="p2"
        symbol="ETHUSD"
        side="SHORT"
        size={2}
        pnl={-5.5}
        onExpand={onExpand}
        onToggleSide={onToggleSide}
        onClose={onClose}
        onSetSLtoBE={onSetSLtoBE}
        onSetSLHit={onSetSLHit}
      />
    );

    fireEvent.click(screen.getByLabelText('Toggle side for ETHUSD'));
    fireEvent.click(screen.getByLabelText('Set SL to BE for ETHUSD'));
    fireEvent.click(screen.getByLabelText('Set SL hit for ETHUSD'));
    fireEvent.click(screen.getByLabelText('Close ETHUSD'));
    fireEvent.click(screen.getByLabelText('Toggle details for ETHUSD'));

    expect(onToggleSide).toHaveBeenCalledWith('p2');
    expect(onSetSLtoBE).toHaveBeenCalledWith('p2');
    expect(onSetSLHit).toHaveBeenCalledWith('p2');
    expect(onClose).toHaveBeenCalledWith('p2');
    expect(onExpand).toHaveBeenCalledWith('p2');

    // negative pnl formatting
    expect(screen.getByText('-5.50')).toBeDefined();
  });
});
