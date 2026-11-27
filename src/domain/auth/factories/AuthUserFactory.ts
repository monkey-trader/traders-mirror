import type { User } from 'firebase/auth'
import type { AuthUser } from '@/domain/auth/interfaces/AuthRepository'

export class AuthUserFactory {
  static create(user: User): AuthUser {
    return {
      uid: user.uid,
      displayName: user.displayName ?? null,
      email: user.email ?? null,
      photoURL: user.photoURL ?? null,
    }
  }
}
