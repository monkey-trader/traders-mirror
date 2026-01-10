import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock AuthService to throw on sign-in and to emit null on state change
vi.mock('@/application/auth/services/AuthService', () => {
  return {
    AuthService: class {
      onAuthStateChanged(cb: (u: unknown) => void) {
        cb(null);
        return () => {};
      }
      async signInWithGoogle() {
        throw new Error('Google Sign-In failed: boom');
      }
      async signOut() {}
    },
  };
});

// Import after mocks
import { AuthProvider } from './AuthProvider';
import { LoginButton } from './LoginButton';

describe('AuthProvider error branch', () => {
  it('surfaces sign-in error via context (LoginButton shows alert)', async () => {
    render(
      <AuthProvider>
        <LoginButton />
      </AuthProvider>
    );
    fireEvent.click(screen.getByRole('button'));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/Google Sign-In failed/);
  });
});
