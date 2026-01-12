import type { AuthRepository, AuthUser } from '@/domain/auth/interfaces/AuthRepository';
import { AuthUserFactory } from '@/domain/auth/factories/AuthUserFactory';

import { ensureFirebase, assertFirebaseEnvOrThrow } from '@/infrastructure/firebase/client';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';

export class FirebaseAuthRepository implements AuthRepository {
  async getCurrentUser(): Promise<AuthUser | null> {
    assertFirebaseEnvOrThrow();
    const { auth } = ensureFirebase();
    const user = auth.currentUser;
    return user ? AuthUserFactory.create(user) : null;
  }

  async signInWithGoogle(): Promise<AuthUser> {
    assertFirebaseEnvOrThrow();
    const { auth } = ensureFirebase();
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return AuthUserFactory.create(result.user);
  }

  async signOut(): Promise<void> {
    assertFirebaseEnvOrThrow();
    const { auth } = ensureFirebase();
    await fbSignOut(auth);
  }

  onAuthStateChanged(handler: (user: AuthUser | null) => void): () => void {
    assertFirebaseEnvOrThrow();
    const { auth } = ensureFirebase();
    // Ensure auth state persists across reloads in the browser
    try {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      setPersistence(auth, browserLocalPersistence);
    } catch {
      /* ignore persistence errors (e.g., in non-browser test environments) */
    }
    const unsubscribe = fbOnAuthStateChanged(auth, (u) => {
      handler(u ? AuthUserFactory.create(u) : null);
    });
    return unsubscribe;
  }
}
