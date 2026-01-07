import type { AuthRepository, AuthUser } from '@/domain/auth/interfaces/AuthRepository';
import { AuthNotAuthenticatedError, AuthProviderError } from '@/domain/auth/errors/AuthError';

export class AuthService {
  constructor(private readonly repo: AuthRepository) {}

  async getCurrentUser(): Promise<AuthUser> {
    const user = await this.repo.getCurrentUser();
    if (!user) throw new AuthNotAuthenticatedError();
    return user;
  }

  async signInWithGoogle(): Promise<AuthUser> {
    try {
      return await this.repo.signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new AuthProviderError(`Google Sign-In failed: ${message}`);
    }
  }

  async signOut(): Promise<void> {
    await this.repo.signOut();
  }

  onAuthStateChanged(handler: (user: AuthUser | null) => void): () => void {
    return this.repo.onAuthStateChanged(handler);
  }
}
