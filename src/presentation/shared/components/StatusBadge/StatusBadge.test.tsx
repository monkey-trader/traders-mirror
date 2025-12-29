import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders OPEN, CLOSED and FILLED correctly with classes', () => {
    const { rerender } = render(<StatusBadge value="OPEN" />);
    expect(screen.getByText('OPEN')).toBeTruthy();

    rerender(<StatusBadge value="CLOSED" />);
    expect(screen.getByText('CLOSED')).toBeTruthy();

    rerender(<StatusBadge value="FILLED" />);
    expect(screen.getByText('FILLED')).toBeTruthy();
  });

  it('calls onClick when clicked and on Enter/Space keydown', () => {
    const handle = vi.fn();
    render(<StatusBadge value="OPEN" onClick={handle} />);
    const el = screen.getByText('OPEN');
    fireEvent.click(el);
    expect(handle).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(el, { key: 'Enter' });
    expect(handle).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(el, { key: ' ' });
    expect(handle).toHaveBeenCalledTimes(3);
  });
});

