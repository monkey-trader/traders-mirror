import type { AuthRepository, AuthUser } from '@/domain/auth/interfaces/AuthRepository'

export class AuthService {
  constructor(private repo: AuthRepository) {}

  getCurrentUser(): Promise<AuthUser | null> {
    return this.repo.getCurrentUser()
  }

  signInWithGoogle(): Promise<AuthUser> {
    return this.repo.signInWithGoogle()
  }

  signOut(): Promise<void> {
    return this.repo.signOut()
  }
}
