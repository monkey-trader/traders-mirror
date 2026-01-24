import { render, screen, fireEvent } from '@testing-library/react';
import { LoginButton } from './LoginButton';
import { AuthProvider } from './AuthProvider';

const mockSignIn = vi.fn();
const mockContext: any = {
  user: null,
  loading: false,
  signIn: mockSignIn,
  signOut: vi.fn(),
  clearError: vi.fn(),
  error: null,
};

vi.mock('./AuthProvider', async (orig) => {
  const actual = await orig();
  return {
    ...(actual as any),
    useAuth: () => mockContext,
  };
});

describe('LoginButton', () => {
  it('renders and triggers signIn', () => {
    render(
      <AuthProvider>
        <LoginButton />
      </AuthProvider>
    );
    const btn = screen.getByRole('button', { name: /login mit google/i });
    fireEvent.click(btn);
    expect(mockSignIn).toHaveBeenCalled();
  });
  it('shows loading', () => {
    mockContext.loading = true;
    render(
      <AuthProvider>
        <LoginButton />
      </AuthProvider>
    );
    expect(screen.getByRole('button')).toHaveTextContent(/loading/i);
    mockContext.loading = false;
  });
  it('renders error alert when error present', () => {
    mockContext.error = 'Google Sign-In failed: x';
    render(
      <AuthProvider>
        <LoginButton />
      </AuthProvider>
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/Google Sign-In failed/);
    mockContext.error = null;
  });
});
