import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestore: Firestore | null = null;

function readEnv(name: string): string | undefined {
  // Support CRA-style FIREBASE prefix and Vite FIREBASE prefix
  const cra = (process.env as Record<string, string | undefined>)[`REACT_APP_FIREBASE_${name}`];
  // In unit tests (NODE_ENV==='test'), ignore import.meta.env to allow tests to fully control env via process.env
  const isTest = (process.env as Record<string, string | undefined>).NODE_ENV === 'test';
  const vite = isTest
    ? undefined
    : ((import.meta as unknown as { env?: Record<string, unknown> }).env?.[
        `VITE_FIREBASE_${name}`
      ] as string | undefined);
  return cra ?? vite;
}

export function ensureFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  if (!firebaseApp) {
    const apiKey = readEnv('API_KEY');
    const authDomain = readEnv('AUTH_DOMAIN');
    const projectId = readEnv('PROJECT_ID');
    const storageBucket = readEnv('STORAGE_BUCKET');
    const messagingSenderId = readEnv('MESSAGING_SENDER_ID');
    const appId = readEnv('APP_ID');

    const missing: string[] = [];
    if (!apiKey) missing.push('API_KEY');
    if (!authDomain) missing.push('AUTH_DOMAIN');
    if (!projectId) missing.push('PROJECT_ID');
    if (!storageBucket) missing.push('STORAGE_BUCKET');
    if (!messagingSenderId) missing.push('MESSAGING_SENDER_ID');
    if (!appId) missing.push('APP_ID');

    if (missing.length) {
      throw new Error(
        `Firebase config missing env vars: ${missing.join(', ')}. ` +
          `Set REACT_APP_FIREBASE_* (CRA) or VITE_FIREBASE_* (Vite) accordingly.`
      );
    }

    firebaseApp = initializeApp({
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    });
    firebaseAuth = getAuth(firebaseApp);
    // Ensure auth state persists across reloads in the browser
    try {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      setPersistence(firebaseAuth, browserLocalPersistence);
    } catch {
      /* ignore persistence errors (e.g., in non-browser test environments) */
    }
    // Use initializeFirestore with network settings that are more resilient to
    // ad/tracker blockers (auto-detected long polling and fetch-based streams).
    // If initializeFirestore is not available or fails, fall back to getFirestore.
    try {
      firestore = initializeFirestore(firebaseApp, {
        experimentalAutoDetectLongPolling: true,
        useFetchStreams: true,
      });
    } catch {
      firestore = getFirestore(firebaseApp);
    }
  }
  return { app: firebaseApp!, auth: firebaseAuth!, db: firestore! };
}

export function assertFirebaseEnvOrThrow(): void {
  const apiKey = readEnv('API_KEY');
  const authDomain = readEnv('AUTH_DOMAIN');
  const projectId = readEnv('PROJECT_ID');
  const storageBucket = readEnv('STORAGE_BUCKET');
  const messagingSenderId = readEnv('MESSAGING_SENDER_ID');
  const appId = readEnv('APP_ID');

  const missing: string[] = [];
  if (!apiKey) missing.push('API_KEY');
  if (!authDomain) missing.push('AUTH_DOMAIN');
  if (!projectId) missing.push('PROJECT_ID');
  if (!storageBucket) missing.push('STORAGE_BUCKET');
  if (!messagingSenderId) missing.push('MESSAGING_SENDER_ID');
  if (!appId) missing.push('APP_ID');

  if (missing.length) {
    throw new Error(
      `Firebase config missing env vars: ${missing.join(', ')}. ` +
        `Set REACT_APP_FIREBASE_* (CRA) or VITE_FIREBASE_* (Vite) accordingly.`
    );
  }
}

export function getCurrentUserId(): string | null {
  const { auth } = ensureFirebase();
  const u = auth.currentUser;
  return u?.uid ?? null;
}

// Test-only helper to reset cached Firebase instances between tests
export function __resetFirebaseForTests(): void {
  firebaseApp = null;
  firebaseAuth = null;
  firestore = null;
}
