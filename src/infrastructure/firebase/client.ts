import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestore: Firestore | null = null;

function readEnv(name: string): string | undefined {
  const cra = (process.env as Record<string, string | undefined>)[`REACT_APP_${name}`];
  const vite = (import.meta as unknown as { env?: Record<string, unknown> }).env?.[
    `VITE_FIREBASE_${name}`
  ] as string | undefined;
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
          `Set REACT_APP_* (CRA) or VITE_FIREBASE_* (Vite) accordingly.`
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
    firestore = getFirestore(firebaseApp);
  }
  return { app: firebaseApp!, auth: firebaseAuth!, db: firestore! };
}

export function getCurrentUserId(): string | null {
  const { auth } = ensureFirebase();
  const u = auth.currentUser;
  return u?.uid ?? null;
}
