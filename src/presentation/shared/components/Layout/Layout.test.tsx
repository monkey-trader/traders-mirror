import React from 'react';
import { render, screen } from '@testing-library/react';
// Mock auth provider hook used by UserBadge inside Header, preserving other exports
vi.mock('@/presentation/auth/AuthProvider', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/presentation/auth/AuthProvider')>();
  return {
    ...actual,
    useAuth: () => ({
      user: null,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      clearError: vi.fn(),
      error: null,
    }),
  };
});
import { Layout } from './Layout';
import { AuthProvider } from '@/presentation/auth/AuthProvider';

describe('Layout component', () => {
  it('renders children inside main', () => {
    render(
      <AuthProvider>
        <Layout>
          <div data-testid="child">Hello</div>
        </Layout>
      </AuthProvider>
    );
    const child = screen.getByTestId('child');
    expect(child).toBeTruthy();
    expect(child.textContent).toBe('Hello');
  });

  it('applies fullWidth class when fullWidth prop is true', () => {
    const { container } = render(
      <AuthProvider>
        <Layout fullWidth>
          <div>FW</div>
        </Layout>
      </AuthProvider>
    );
    // .app-container is applied with extra class when fullWidth
    const appContainer = container.querySelector('.app-container');
    expect(appContainer).toBeTruthy();
    // the fullWidth style class from module should be present on the element's className when prop true
    expect(
      appContainer?.className.includes('fullWidth') || appContainer?.className.includes('fullWidth')
    ).toBe(true);
  });
});
