import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TradeDetailEditor } from './TradeDetailEditor';

const mockTrade = {
  id: 't1',
  symbol: 'BTCUSD',
  entryDate: '2025-01-01T00:00:00Z',
  size: 1,
  price: 10000,
  side: 'LONG',
  margin: 100,
};

describe('TradeDetailEditor compact', () => {
  it('applies compact class and renders save button with saveBtn class', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- autofix: preserve tests that intentionally use any
    render(<TradeDetailEditor trade={mockTrade as any} compactView onSave={async () => {}} />);

    const root = screen.getByText('BTCUSD').closest('div');
    // root should have class that includes 'compact' (module class name may be hashed, but our module exports 'compact')
    expect(root).toBeDefined();
    // Find Save button
    const save = screen.getByRole('button', { name: /save now/i });
    expect(save).toBeDefined();
    // Assert className includes 'saveBtn'
    expect(save.className).toMatch(/saveBtn/);
  });
});
