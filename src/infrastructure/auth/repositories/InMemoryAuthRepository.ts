import type { AuthRepository, AuthUser } from '@/domain/auth/interfaces/AuthRepository';

export class InMemoryAuthRepository implements AuthRepository {
  private currentUser: AuthUser | null = null;

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.currentUser;
  }

  async signInWithGoogle(): Promise<AuthUser> {
    // Return a deterministic fake user for tests
    const user: AuthUser = {
      id: 'test-user',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null,
    };
    this.currentUser = user;
    return user;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
  }

  onAuthStateChanged(handler: (user: AuthUser | null) => void): () => void {
    // Immediately notify with current state; allow tests to unsubscribe
    handler(this.currentUser);
    return () => {
      /* no-op */
    };
  }
}
