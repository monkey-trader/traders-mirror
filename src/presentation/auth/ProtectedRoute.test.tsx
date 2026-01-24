import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthProvider } from './AuthProvider';

const mockContext: any = {
  user: null,
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
};

vi.mock('./AuthProvider', async (orig) => {
  const actual = await orig();
  return {
    ...(actual as any),
    useAuth: () => mockContext,
  };
});

describe('ProtectedRoute', () => {
  it('shows login prompt if not authenticated', () => {
    mockContext.user = null;
    render(
      <AuthProvider>
        <ProtectedRoute>Secret</ProtectedRoute>
      </AuthProvider>
    );
    expect(screen.getByText(/bitte einloggen/i)).toBeInTheDocument();
  });
  it('shows children if authenticated', () => {
    mockContext.user = { id: 'u1', displayName: 'Max', email: 'max@x.de', photoURL: null };
    render(
      <AuthProvider>
        <ProtectedRoute>Secret</ProtectedRoute>
      </AuthProvider>
    );
    expect(screen.getByText('Secret')).toBeInTheDocument();
  });
  it('shows loading', () => {
    mockContext.loading = true;
    render(
      <AuthProvider>
        <ProtectedRoute>Secret</ProtectedRoute>
      </AuthProvider>
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    mockContext.loading = false;
  });
});
