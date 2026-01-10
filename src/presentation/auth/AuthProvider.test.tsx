import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthProvider';

function Probe() {
  const { user, loading, signIn, signOut } = useAuth();
  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="user">{user ? user.displayName : 'none'}</div>
      <button type="button" onClick={() => void signIn()}>
        sign-in
      </button>
      <button type="button" onClick={() => void signOut()}>
        sign-out
      </button>
    </div>
  );
}

describe('AuthProvider (test mode)', () => {
  it('initializes with no user and loading=false', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    // onAuthStateChanged in InMemoryAuthRepository fires immediately
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('signIn sets a deterministic fake user', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('sign-in').click();
    });

    expect(screen.getByTestId('user').textContent).toBe('Test User');
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('signOut clears user and sets loading=false', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('sign-in').click();
    });
    expect(screen.getByTestId('user').textContent).toBe('Test User');

    await act(async () => {
      screen.getByText('sign-out').click();
    });

    expect(screen.getByTestId('user').textContent).toBe('none');
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });
});
