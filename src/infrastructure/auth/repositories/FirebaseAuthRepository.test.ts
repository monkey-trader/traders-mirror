import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AuthUser } from '@/domain/auth/interfaces/AuthRepository';

// Define mocks using vi.hoisted so they can be referenced safely inside vi.mock factories
const hoisted = vi.hoisted(() => {
  const mockGetAuth = vi.fn(() => ({ currentUser: null }));
  const mockInitializeApp = vi.fn(() => ({ app: true }));
  const mockSignInWithPopup = vi.fn(async () => ({
    user: { uid: 'u-fb', displayName: 'FB User', email: 'fb@example.com', photoURL: 'http://x' },
  }));
  const mockSignOut = vi.fn(async () => {});
  let onChangeHandler: (u: unknown) => void = () => {};
  const mockOnAuthStateChanged = vi.fn((auth, cb: (u: unknown) => void) => {
    onChangeHandler = cb;
    return () => {};
  });
  const mockSetPersistence = vi.fn(async () => {});
  const mockBrowserLocalPersistence = {} as unknown;
  return {
    mockGetAuth,
    mockInitializeApp,
    mockSignInWithPopup,
    mockSignOut,
    mockOnAuthStateChanged,
    mockSetPersistence,
    mockBrowserLocalPersistence,
    getOnChangeHandler: () => onChangeHandler,
  };
});

vi.mock('firebase/app', () => ({
  initializeApp: hoisted.mockInitializeApp,
}));

vi.mock('firebase/auth', () => ({
  getAuth: hoisted.mockGetAuth,
  signInWithPopup: hoisted.mockSignInWithPopup,
  GoogleAuthProvider: class {},
  signOut: hoisted.mockSignOut,
  onAuthStateChanged: hoisted.mockOnAuthStateChanged,
  setPersistence: hoisted.mockSetPersistence,
  browserLocalPersistence: hoisted.mockBrowserLocalPersistence,
}));

// Shared ensureFirebase also initializes Firestore; provide a minimal mock to avoid SDK internals
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({ db: true })),
}));

// Import after mocks so repository uses the mocked SDK
import { FirebaseAuthRepository } from './FirebaseAuthRepository';
import { __resetFirebaseForTests } from '@/infrastructure/firebase/client';

const saveEnv = { ...process.env };

beforeEach(() => {
  // Reset env used by ensureFirebase
  for (const k of Object.keys(process.env)) {
    if (k.startsWith('REACT_APP_FIREBASE_') || k.startsWith('VITE_FIREBASE_')) {
      delete (process.env as NodeJS.ProcessEnv)[k];
    }
  }
  vi.resetModules();
  __resetFirebaseForTests();
  hoisted.mockInitializeApp.mockClear();
  hoisted.mockGetAuth.mockClear();
  hoisted.mockSignInWithPopup.mockClear();
  hoisted.mockOnAuthStateChanged.mockClear();
  hoisted.mockSignOut.mockClear();
  hoisted.mockSetPersistence.mockClear();
});

describe('FirebaseAuthRepository (env + SDK interactions mocked)', () => {
  it('throws when Firebase env config is missing', async () => {
    const repo = new FirebaseAuthRepository();
    await expect(repo.getCurrentUser()).rejects.toThrow(/Firebase config missing/);
  });

  it('signInWithGoogle maps user via factory when env present', async () => {
    process.env.REACT_APP_FIREBASE_API_KEY = 'k';
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN = 'd';
    process.env.REACT_APP_FIREBASE_PROJECT_ID = 'p';
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET = 'b';
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID = 'm';
    process.env.REACT_APP_FIREBASE_APP_ID = 'a';

    const repo = new FirebaseAuthRepository();
    const user: AuthUser = await repo.signInWithGoogle();
    expect(user.id).toBe('u-fb');
    expect(user.displayName).toBe('FB User');
    expect(user.email).toBe('fb@example.com');
    expect(hoisted.mockInitializeApp).toHaveBeenCalledTimes(1);
    expect(hoisted.mockGetAuth).toHaveBeenCalledTimes(1);
    expect(hoisted.mockSetPersistence).toHaveBeenCalledTimes(1);
    expect(hoisted.mockSignInWithPopup).toHaveBeenCalledTimes(1);
  });

  it('onAuthStateChanged maps and forwards user', async () => {
    process.env.REACT_APP_FIREBASE_API_KEY = 'k';
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN = 'd';
    process.env.REACT_APP_FIREBASE_PROJECT_ID = 'p';
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET = 'b';
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID = 'm';
    process.env.REACT_APP_FIREBASE_APP_ID = 'a';

    const repo = new FirebaseAuthRepository();
    let received: AuthUser | null = null;
    const unsub = repo.onAuthStateChanged((u) => {
      received = u;
    });
    // simulate SDK callback
    hoisted.getOnChangeHandler()({
      uid: 'user-xyz',
      displayName: 'X',
      email: 'x@y',
      photoURL: null,
    });
    expect((received as any)?.id).toBe('user-xyz');
    expect(typeof unsub).toBe('function');
  });

  it('signOut delegates to SDK', async () => {
    process.env.REACT_APP_FIREBASE_API_KEY = 'k';
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN = 'd';
    process.env.REACT_APP_FIREBASE_PROJECT_ID = 'p';
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET = 'b';
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID = 'm';
    process.env.REACT_APP_FIREBASE_APP_ID = 'a';

    const repo = new FirebaseAuthRepository();
    await repo.signOut();
    expect(hoisted.mockSignOut).toHaveBeenCalledTimes(1);
  });
});

afterAll(() => {
  process.env = saveEnv;
});
