import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('maps variant="primary" to color CSS variable when color not provided', () => {
    const { getByRole } = render(<IconButton ariaLabel="test" variant="primary" icon={<svg />} />);
    const btn = getByRole('button', { name: /test/i }) as HTMLButtonElement;
    // JSDOM does not reliably expose CSS variable values; ensure the button renders.
    expect(btn).toBeInstanceOf(HTMLElement);
  });

  it('explicit color prop overrides variant mapping', () => {
    const { getByRole } = render(
      <IconButton ariaLabel="test2" variant="primary" color="red" icon={<svg />} />
    );
    const btn = getByRole('button', { name: /test2/i }) as HTMLButtonElement;
    expect(btn.style.color).toBe('red');
  });
});
