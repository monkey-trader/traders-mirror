import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { TimeframeWizard } from './TimeframeWizard';
import { DEFAULT_TIMEFRAMES, type TimeframeKey } from '@/presentation/analysis/types';

function makeTimeframes() {
  return DEFAULT_TIMEFRAMES.map((tf: TimeframeKey) => ({ timeframe: tf }));
}

describe('TimeframeWizard', () => {
  test('renders pager and navigates between frames', () => {
    const tfs = makeTimeframes();
    const onChange = vi.fn();
    render(<TimeframeWizard timeframes={tfs} onChangeTimeframe={onChange} />);

    // pager buttons present
    const monthlyBtn = screen.getByRole('button', { name: /jump to monthly timeframe/i });
    expect(monthlyBtn).toBeDefined();

    const dailyBtn = screen.getByRole('button', { name: /jump to daily timeframe/i });
    expect(dailyBtn).toBeDefined();

    // click daily and ensure pager moves
    fireEvent.click(dailyBtn);
    // now the displayed title should be DAILY (heading inside the card)
    expect(screen.getByRole('heading', { name: /DAILY/ })).toBeDefined();
  });

  test('editing fields calls onChangeTimeframe with correct index and patch', () => {
    const tfs = makeTimeframes();
    const onChange = vi.fn();
    render(<TimeframeWizard timeframes={tfs} onChangeTimeframe={onChange} />);

    // input tradingview link for the first timeframe (monthly)
    const tvInput = screen.getByLabelText(/TradingView Link/i);
    fireEvent.change(tvInput, { target: { value: 'https://tv/1' } });

    expect(onChange).toHaveBeenCalledWith(0, { tradingViewLink: 'https://tv/1' });
  });

  test('skip advances to next and leaves fields empty', () => {
    const tfs = makeTimeframes();
    const onChange = vi.fn();
    render(<TimeframeWizard timeframes={tfs} onChangeTimeframe={onChange} />);

    const skipBtn = screen.getByRole('button', { name: /skip/i });
    fireEvent.click(skipBtn);

    // after skipping, the pager should show the second timeframe (heading)
    expect(screen.getByRole('heading', { name: /WEEKLY/ })).toBeDefined();
  });

  test('next and finish behaviour triggers onFinish', () => {
    const tfs = makeTimeframes();
    const onChange = vi.fn();
    const onFinish = vi.fn();
    render(<TimeframeWizard timeframes={tfs} onChangeTimeframe={onChange} onFinish={onFinish} />);

    const nextBtn = screen.getByRole('button', { name: /next/i });
    // click next until last
    for (let i = 0; i < tfs.length - 1; i++) {
      fireEvent.click(nextBtn);
    }

    // now the finish button should be present
    const finishBtn = screen.getByRole('button', { name: /finish/i });
    fireEvent.click(finishBtn);

    expect(onFinish).toHaveBeenCalled();
  });
});
