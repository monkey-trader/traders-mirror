import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { TradeDetailEditor } from './TradeDetailEditor';

const sample = {
  id: 't1',
  symbol: 'ETHUSD',
  entryDate: '2025-12-21T10:12:00Z',
  size: 0.51,
  price: 1800.5,
  side: 'SHORT',
  notes: 'Scalp-Short nach Fehlausbruch.',
};

describe('TradeDetailEditor delete flow', () => {
  it('calls onDelete with the trade id when Delete clicked', async () => {
    const onDelete = vi.fn(() => Promise.resolve());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- autofix: preserve tests that intentionally use any
    render(<TradeDetailEditor trade={sample as any} onDelete={onDelete} onSave={async () => {}} />);

    // find Delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i }) as HTMLButtonElement;
    expect(deleteButton).toBeTruthy();

    // click delete
    fireEvent.click(deleteButton);

    // expect onDelete called with id
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalled();
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- autofix: preserve tests that intentionally use any
    const calledWith = (onDelete as any).mock?.calls?.[0]?.[0];
    expect(calledWith).toBe('t1');
  });
});
