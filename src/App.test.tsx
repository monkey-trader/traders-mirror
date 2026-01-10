import React from 'react';
import { render, screen } from '@testing-library/react';
// Ensure auth and protected route don't block rendering in this smoke test
vi.mock('@/presentation/auth/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: { id: 'user123', displayName: 'Test User', email: 't@x.de', photoURL: null },
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    clearError: vi.fn(),
    error: null,
  }),
}));
vi.mock('@/presentation/auth/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
import App from './App';
import { AuthProvider } from '@/presentation/auth/AuthProvider';

test('App renders header brand', () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  expect(screen.getByText(/Traders Mirror/i)).toBeInTheDocument();
});
