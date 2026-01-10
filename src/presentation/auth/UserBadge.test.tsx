import React from 'react';
import { render, screen } from '@testing-library/react';
import type { AuthUser } from '@/domain/auth/interfaces/AuthRepository';

// Provide a single mock that reads from mutable state to avoid hoisting issues
const mockState: { user: AuthUser | null } = {
  user: {
    id: 'u1',
    displayName: 'Ada Lovelace',
    email: 'ada@example.com',
    photoURL: null,
  },
};
vi.mock('./AuthProvider', () => ({
  useAuth: () => ({
    user: mockState.user,
    loading: false,
    signOut: vi.fn(),
    error: null,
    signIn: vi.fn(),
    clearError: vi.fn(),
  }),
}));
import { UserBadge } from './UserBadge';

describe('UserBadge', () => {
  it('renders initials and name', () => {
    render(<UserBadge />);
    // Avatar shows initials when no photoURL
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  });
  it('compactView hides name', () => {
    render(<UserBadge compactView />);
    expect(screen.queryByText('Ada Lovelace')).toBeNull();
  });
});

describe('UserBadge (null user and photo avatar)', () => {
  it('returns null when no user', () => {
    mockState.user = null;
    const { container } = render(<UserBadge />);
    expect(container.firstChild).toBeNull();
  });
  it('renders img when photoURL exists', () => {
    mockState.user = {
      id: 'u2',
      displayName: null,
      email: 'user@example.com',
      photoURL: 'http://a',
    };
    render(<UserBadge />);
    // The image is inside an aria-hidden container; query by alt text
    expect(screen.getByAltText('user@example.com')).toHaveAttribute('src', 'http://a');
  });
});
