import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Settings } from './Settings';

describe('Settings commit link', () => {
  it('renders commit link with default repo when env set', () => {
    process.env.REACT_APP_BUILD_BRANCH = 'main';
    process.env.REACT_APP_BUILD_SHA = 'abcdef1234567';
    render(<Settings />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/monkey-trader/traders-mirror/commit/abcdef1234567'
    );
  });
});
