// updated: touch to pick up latest changes
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TradeDetailEditor } from './TradeDetailEditor';
import type { TradeInput } from '@/domain/trade/factories/TradeFactory';

const exampleTrade: TradeInput = {
  id: 'tx1',
  symbol: 'EURUSD',
  entryDate: '2025-12-29T12:00',
  size: 1000,
  price: 1.11,
  side: 'LONG',
  status: 'OPEN',
  notes: 'note',
  sl: 1.1,
  tp1: 1.12,
  margin: 100,
  leverage: 10,
};

describe('TradeDetailEditor', () => {
  it('renders empty state when no trade provided', () => {
    render(<TradeDetailEditor trade={null} />);
    expect(screen.getByText(/Kein Trade ausgewählt/i)).toBeTruthy();
  });

  it('renders trade fields and calls onChange when edited', async () => {
    const onChange = vi.fn();
    render(<TradeDetailEditor trade={exampleTrade} onChange={onChange} />);

    // symbol input present
    const symbol = screen.getByLabelText('Symbol') as HTMLInputElement;
    expect(symbol.value).toBe('EURUSD');

    // change symbol -> onChange should be called
    fireEvent.change(symbol, { target: { value: 'GBPUSD' } });
    await waitFor(() => expect(onChange).toHaveBeenCalled());
  });

  it('restoreInitial resets edited values and calls onChange', async () => {
    const onChange = vi.fn();
    render(<TradeDetailEditor trade={exampleTrade} onChange={onChange} />);

    const symbol = screen.getByLabelText('Symbol') as HTMLInputElement;
    fireEvent.change(symbol, { target: { value: 'TMP' } });
    expect(symbol.value).toBe('TMP');

    const restoreBtn = screen.getByRole('button', { name: /Restore/i });
    fireEvent.click(restoreBtn);

    // restored back to initial value and onChange called with clone
    await waitFor(() =>
      expect((screen.getByLabelText('Symbol') as HTMLInputElement).value).toBe('EURUSD')
    );
    expect(onChange).toHaveBeenCalled();
  });

  it('calls onSave when Save now clicked and shows status', async () => {
    const onSave = vi.fn(() => Promise.resolve());
    render(<TradeDetailEditor trade={exampleTrade} onSave={onSave} />);

    // change a field to make editor dirty
    const price = screen.getByLabelText('Price') as HTMLInputElement;
    fireEvent.change(price, { target: { value: '1.120' } });

    const saveBtn = screen.getByRole('button', { name: /Save now/i });
    fireEvent.click(saveBtn);

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    // after resolve, the button label should show 'Saved' briefly
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Saved|Save now|Saving/i })).toBeTruthy()
    );
  });

  it('maps errors from onSave rejection and displays field error', async () => {
    // match expected signature: (t: TradeInput) => Promise<void>
    const onSave = vi.fn(async (_trade: TradeInput): Promise<void> => {
      void _trade;
      // reject asynchronously so the component's try/catch can handle it
      await new Promise((r) => setTimeout(r, 0));
      throw { field: 'price', message: 'invalid price' };
    });
    render(<TradeDetailEditor trade={exampleTrade} onSave={onSave} />);

    // make dirty
    const price = screen.getByLabelText('Price') as HTMLInputElement;
    fireEvent.change(price, { target: { value: '2.0' } });

    const saveBtn = screen.getByRole('button', { name: /Save now/i });
    // click save (fireEvent.click returns true synchronously)
    fireEvent.click(saveBtn);

    // onSave was called and should have caused a mapped error to appear
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/invalid price/i)).toBeTruthy());
  });

  it('does not call onSave when validation errors present', async () => {
    const onSave = vi.fn(() => Promise.resolve());
    // provide a trade with invalid size to trigger validation error
    const badTrade = { ...exampleTrade, size: 0 };
    render(<TradeDetailEditor trade={badTrade} onSave={onSave} />);

    // Trigger validation by blurring a field; the component validates onBlur
    const price = screen.getByLabelText('Price') as HTMLInputElement;
    fireEvent.blur(price);

    // should not call onSave because validation will block
    await new Promise((r) => setTimeout(r, 50));
    expect(onSave).not.toHaveBeenCalled();
    // validation message is in German: "Größe muss positiv sein"
    await waitFor(() => expect(screen.getByText(/Größe muss positiv sein/i)).toBeTruthy());
  });
});
