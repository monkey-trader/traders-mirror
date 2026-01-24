import { render, screen, fireEvent } from '@testing-library/react';
import { LogoutButton } from './LogoutButton';
import { AuthProvider } from './AuthProvider';

const mockSignOut = vi.fn();
const mockContext: any = {
  user: { id: 'u1', displayName: 'Max', email: 'max@x.de', photoURL: null },
  loading: false,
  signIn: vi.fn(),
  signOut: mockSignOut,
};

vi.mock('./AuthProvider', async (orig) => {
  const actual = await orig();
  return {
    ...(actual as any),
    useAuth: () => mockContext,
  };
});

describe('LogoutButton', () => {
  it('renders and triggers signOut', () => {
    render(
      <AuthProvider>
        <LogoutButton />
      </AuthProvider>
    );
    const btn = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(btn);
    expect(mockSignOut).toHaveBeenCalled();
  });
  it('shows loading', () => {
    mockContext.loading = true;
    render(
      <AuthProvider>
        <LogoutButton />
      </AuthProvider>
    );
    expect(screen.getByRole('button')).toHaveTextContent(/abmelden/i);
    mockContext.loading = false;
  });
});
