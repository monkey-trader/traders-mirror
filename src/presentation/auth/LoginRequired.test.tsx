import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider } from './AuthProvider';
import { LoginRequired } from './LoginRequired';

const mockSignIn = vi.fn();
const mockContext = {
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
    ...actual,
    useAuth: () => mockContext,
  };
});

describe('LoginRequired', () => {
  afterEach(() => {
    mockSignIn.mockClear();
    mockContext.loading = false;
  });

  it('renders message and triggers signIn on click', () => {
    render(
      <AuthProvider>
        <LoginRequired />
      </AuthProvider>
    );
    // Button exists and is enabled
    const btn = screen.getByRole('button', { name: /login mit google/i });
    expect(btn).toBeEnabled();
    // Click triggers signIn
    fireEvent.click(btn);
    expect(mockSignIn).toHaveBeenCalled();
  });

  it('shows loading state from context', () => {
    mockContext.loading = true;
    render(
      <AuthProvider>
        <LoginRequired />
      </AuthProvider>
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent(/anmelden…/i);
  });

  it('respects loading prop override', () => {
    render(
      <AuthProvider>
        <LoginRequired loading />
      </AuthProvider>
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent(/anmelden…/i);
  });
});
