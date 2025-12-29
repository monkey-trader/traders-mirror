import React from 'react';
import { render, screen } from '@testing-library/react';
import { Layout } from './Layout';

describe('Layout component', () => {
  it('renders children inside main', () => {
    render(
      <Layout>
        <div data-testid="child">Hello</div>
      </Layout>
    );
    const child = screen.getByTestId('child');
    expect(child).toBeTruthy();
    expect(child.textContent).toBe('Hello');
  });

  it('applies fullWidth class when fullWidth prop is true', () => {
    const { container } = render(
      <Layout fullWidth>
        <div>FW</div>
      </Layout>
    );
    // .app-container is applied with extra class when fullWidth
    const appContainer = container.querySelector('.app-container');
    expect(appContainer).toBeTruthy();
    // the fullWidth style class from module should be present on the element's className when prop true
    expect(appContainer?.className.includes('fullWidth') || appContainer?.className.includes('fullWidth')).toBe(true);
  });
});

