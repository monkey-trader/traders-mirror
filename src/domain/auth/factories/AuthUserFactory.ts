import { UserId } from '../valueObjects/UserId';
import type { AuthUser } from '../interfaces/AuthRepository';

export class AuthUserFactory {
  static create(input: unknown): AuthUser {
    if (!input || typeof input !== 'object') throw new Error('Invalid input for AuthUserFactory');
    const user = input as Record<string, unknown>;
    const id = new UserId(String(user.id ?? user.uid ?? ''));
    return {
      id: id.value,
      displayName: typeof user.displayName === 'string' ? user.displayName : null,
      email: typeof user.email === 'string' ? user.email : null,
      photoURL: typeof user.photoURL === 'string' ? user.photoURL : null,
    };
  }
}
