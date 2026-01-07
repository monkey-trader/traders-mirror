import { AuthService } from './AuthService';
import type { AuthRepository, AuthUser } from '@/domain/auth/interfaces/AuthRepository';
import { AuthNotAuthenticatedError, AuthProviderError } from '@/domain/auth/errors/AuthError';

describe('AuthService', () => {
  let repo: jest.Mocked<AuthRepository>;
  let service: AuthService;
  const user: AuthUser = { id: 'u1', displayName: 'Max', email: 'max@x.de', photoURL: null };

  beforeEach(() => {
    repo = {
      getCurrentUser: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    };
    service = new AuthService(repo);
  });

  it('getCurrentUser returns user', async () => {
    repo.getCurrentUser.mockResolvedValue(user);
    await expect(service.getCurrentUser()).resolves.toEqual(user);
  });

  it('getCurrentUser throws if not logged in', async () => {
    repo.getCurrentUser.mockResolvedValue(null);
    await expect(service.getCurrentUser()).rejects.toBeInstanceOf(AuthNotAuthenticatedError);
  });

  it('signInWithGoogle returns user', async () => {
    repo.signInWithGoogle.mockResolvedValue(user);
    await expect(service.signInWithGoogle()).resolves.toEqual(user);
  });

  it('signInWithGoogle throws on error', async () => {
    repo.signInWithGoogle.mockRejectedValue(new Error('fail'));
    await expect(service.signInWithGoogle()).rejects.toBeInstanceOf(AuthProviderError);
  });

  it('signOut calls repo', async () => {
    await service.signOut();
    expect(repo.signOut).toHaveBeenCalled();
  });
});
