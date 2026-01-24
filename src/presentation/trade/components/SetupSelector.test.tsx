import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';

// Top-level mock so the module is replaced before imports
vi.mock('@/presentation/confluenceWizard/ConfluenceModal', () => {
  return {
    __esModule: true,
    default: (props: any) => {
      if (props.open && typeof props.onConfirm === 'function') {
        const sample = {
          selections: {
            Monthly: { confluence: { 'Liquidität cluster': true }, extra: {} },
            Daily: { confluence: { '50 EMA': true }, extra: { 'CME Close': true } },
          },
        };
        props.onConfirm(sample);
      }
      return <div />;
    },
    ConfluenceModal: (_props: any) => <div />,
  };
});

import { SetupSelector } from './SetupSelector';

describe('SetupSelector', () => {
  it('maps aggregated wizard selections to ConfluenceOption[] and calls onChange', async () => {
    const onChange = vi.fn();

    render(<SetupSelector selectedConfluence={[]} selectedFibLevel={null} onChange={onChange} />);

    // Click the button that opens the Confluence modal (label present in UI)
    const openBtn = screen.getByRole('button', { name: /Confluence/i });
    fireEvent.click(openBtn);

    // Our mocked modal calls onConfirm immediately; SetupSelector should map and call onChange
    expect(onChange).toHaveBeenCalled();
    const mapped = onChange.mock.calls[0][1];
    // Expect mapped (second arg) to be an array with entries for the two timeframes
    expect(Array.isArray(mapped)).toBe(true);
    const timeframes = mapped
      .filter((m: any) => m.timeframe)
      .map((m: any) => m.timeframe)
      .sort();
    expect(timeframes).toEqual(['Daily', 'Monthly'].sort());
  });
});
