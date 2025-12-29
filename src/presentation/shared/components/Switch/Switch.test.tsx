import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Switch } from './Switch';

describe('Switch', () => {
  it('renders label and has role switch with aria-checked', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Switch
        checked={false}
        onChange={onChange}
        id="s1"
        label="My Switch"
        ariaLabel="switch-aria"
      />
    );

    expect(screen.getByText('My Switch')).toBeTruthy();
    const btn = screen.getByRole('switch');
    expect(btn.getAttribute('aria-checked')).toBe('false');
    expect(btn.getAttribute('aria-label')).toBe('switch-aria');

    // click should call onChange with inverted value
    fireEvent.click(btn);
    expect(onChange).toHaveBeenCalledWith(true);

    // rerender checked true and click again
    rerender(<Switch checked={true} onChange={onChange} id="s1" />);
    const btn2 = screen.getByRole('switch');
    expect(btn2.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(btn2);
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
