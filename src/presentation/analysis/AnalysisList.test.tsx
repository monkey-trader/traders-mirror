import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalysisList } from './AnalysisList';
import { vi } from 'vitest';

describe('AnalysisList', () => {
  it('renders empty state', () => {
    render(<AnalysisList />);
    expect(screen.getByText(/Keine Analysen vorhanden/i)).toBeDefined();
  });

  it('renders items and handles open', () => {
    const items = [
      { id: 'a1', symbol: 'EURUSD', createdAt: new Date().toISOString(), notes: 'note' },
    ];
    const onOpen = vi.fn();
    render(<AnalysisList items={items} onOpen={onOpen} />);
    expect(screen.getByText(/EURUSD/)).toBeDefined();
    fireEvent.click(screen.getByText(/Open/));
    expect(onOpen).toHaveBeenCalledWith('a1');
  });
});
