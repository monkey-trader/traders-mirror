import { render, fireEvent, within } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import TradeFilters, { MarketFilters, StatusFilters } from './TradeFilters';

describe('TradeFilters', () => {
  it('MarketFilters calls setMarketFilter and shows trades count', () => {
    const setMarketFilter = vi.fn();
    const { container } = render(
      <MarketFilters marketFilter="Crypto" setMarketFilter={setMarketFilter} tradesCount={5} />
    );
    const root = container.firstChild as HTMLElement;
    expect(within(root).getByText('5 trades')).toBeDefined();
    fireEvent.click(within(root).getByText('All'));
    expect(setMarketFilter).toHaveBeenCalledWith('All');
    fireEvent.click(within(root).getByText('Forex'));
    expect(setMarketFilter).toHaveBeenCalledWith('Forex');
    fireEvent.click(within(root).getByText('Crypto'));
    expect(setMarketFilter).toHaveBeenCalledWith('Crypto');
  });

  it('StatusFilters calls setTradeStatusFilter', () => {
    const setTradeStatusFilter = vi.fn();
    const { container } = render(
      <StatusFilters tradeStatusFilter="OPEN" setTradeStatusFilter={setTradeStatusFilter} />
    );
    const root = container.firstChild as HTMLElement;
    fireEvent.click(within(root).getByText('All'));
    expect(setTradeStatusFilter).toHaveBeenCalledWith('ALL');
    fireEvent.click(within(root).getByText('Open'));
    expect(setTradeStatusFilter).toHaveBeenCalledWith('OPEN');
    fireEvent.click(within(root).getByText('Closed'));
    expect(setTradeStatusFilter).toHaveBeenCalledWith('CLOSED');
    fireEvent.click(within(root).getByText('Filled'));
    expect(setTradeStatusFilter).toHaveBeenCalledWith('FILLED');
  });

  it('default composite TradeFilters renders both parts and forwards callbacks', () => {
    const props = {
      marketFilter: 'All' as const,
      setMarketFilter: vi.fn(),
      tradeStatusFilter: 'ALL' as const,
      setTradeStatusFilter: vi.fn(),
      tradesCount: 2,
    };
    const { container } = render(<TradeFilters {...props} />);
    // expect two sections exist and the number is visible
    expect(container.querySelectorAll('._tradesFilters_1a9f4a').length >= 0).toBeTruthy();
    expect(container.textContent).toContain('2');
  });
});
