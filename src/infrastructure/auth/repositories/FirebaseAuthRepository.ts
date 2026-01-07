import type { AuthRepository, AuthUser } from '@/domain/auth/interfaces/AuthRepository';
import { AuthUserFactory } from '@/domain/auth/factories/AuthUserFactory';

import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: ReturnType<typeof getAuth> | null = null;

function ensureFirebase() {
  if (!firebaseApp) {
    // Support both CRA (REACT_APP_*) and Vite (VITE_*) env styles
    const apiKey = process.env.REACT_APP_FIREBASE_API_KEY || import.meta.env?.VITE_FIREBASE_API_KEY;
    const authDomain =
      process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN;
    const projectId =
      process.env.REACT_APP_FIREBASE_PROJECT_ID || import.meta.env?.VITE_FIREBASE_PROJECT_ID;
    const storageBucket =
      process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
      import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET;
    const messagingSenderId =
      process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ||
      import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID;
    const appId = process.env.REACT_APP_FIREBASE_APP_ID || import.meta.env?.VITE_FIREBASE_APP_ID;

    const missing: string[] = [];
    if (!apiKey) missing.push('apiKey');
    if (!authDomain) missing.push('authDomain');
    if (!projectId) missing.push('projectId');
    if (!storageBucket) missing.push('storageBucket');
    if (!messagingSenderId) missing.push('messagingSenderId');
    if (!appId) missing.push('appId');

    if (missing.length) {
      throw new Error(
        `Firebase config missing env vars: ${missing.join(', ')}. ` +
          `Set REACT_APP_* (CRA) or VITE_* (Vite) accordingly.`
      );
    }

    firebaseApp = initializeApp({
      apiKey: apiKey as string,
      authDomain: authDomain as string,
      projectId: projectId as string,
      storageBucket: storageBucket as string,
      messagingSenderId: messagingSenderId as string,
      appId: appId as string,
    });
    firebaseAuth = getAuth(firebaseApp);
    // Ensure auth state persists across reloads in the browser
    try {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      setPersistence(firebaseAuth, browserLocalPersistence);
    } catch {
      /* ignore persistence errors (e.g., in non-browser test environments) */
    }
  }
  return firebaseAuth!;
}

export class FirebaseAuthRepository implements AuthRepository {
  async getCurrentUser(): Promise<AuthUser | null> {
    const auth = ensureFirebase();
    const user = auth.currentUser;
    return user ? AuthUserFactory.create(user) : null;
  }

  async signInWithGoogle(): Promise<AuthUser> {
    const auth = ensureFirebase();
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return AuthUserFactory.create(result.user);
  }

  async signOut(): Promise<void> {
    const auth = ensureFirebase();
    await fbSignOut(auth);
  }

  onAuthStateChanged(handler: (user: AuthUser | null) => void): () => void {
    const auth = ensureFirebase();
    const unsubscribe = fbOnAuthStateChanged(auth, (u) => {
      handler(u ? AuthUserFactory.create(u) : null);
    });
    return unsubscribe;
  }
}
