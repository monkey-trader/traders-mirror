import { AuthService } from './AuthService';
import type { AuthRepository, AuthUser } from '@/domain/auth/interfaces/AuthRepository';
import { AuthNotAuthenticatedError, AuthProviderError } from '@/domain/auth/errors/AuthError';
import { vi } from 'vitest';

describe('AuthService', () => {
  // Use lightweight mocks compatible with vitest
  let repo: Partial<AuthRepository> & Record<string, any>;
  let service: AuthService;
  let getCurrentUser: ReturnType<typeof vi.fn>;
  let signInWithGoogle: ReturnType<typeof vi.fn>;
  let signOut: ReturnType<typeof vi.fn>;
  const user: AuthUser = { id: 'u1', displayName: 'Max', email: 'max@x.de', photoURL: null };

  beforeEach(() => {
    getCurrentUser = vi.fn();
    signInWithGoogle = vi.fn();
    signOut = vi.fn();
    repo = {
      getCurrentUser: getCurrentUser as any,
      signInWithGoogle: signInWithGoogle as any,
      signOut: signOut as any,
    };
    service = new AuthService(repo as AuthRepository);
  });

  it('getCurrentUser returns user', async () => {
    getCurrentUser.mockResolvedValue(user);
    await expect(service.getCurrentUser()).resolves.toEqual(user);
  });

  it('getCurrentUser throws if not logged in', async () => {
    getCurrentUser.mockResolvedValue(null);
    await expect(service.getCurrentUser()).rejects.toBeInstanceOf(AuthNotAuthenticatedError);
  });

  it('signInWithGoogle returns user', async () => {
    signInWithGoogle.mockResolvedValue(user);
    await expect(service.signInWithGoogle()).resolves.toEqual(user);
  });

  it('signInWithGoogle throws on error', async () => {
    signInWithGoogle.mockRejectedValue(new Error('fail'));
    await expect(service.signInWithGoogle()).rejects.toBeInstanceOf(AuthProviderError);
  });

  it('signOut calls repo', async () => {
    await service.signOut();
    expect(signOut).toHaveBeenCalled();
  });
});
