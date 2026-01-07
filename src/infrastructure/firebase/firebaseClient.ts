// DEBUG: Log all env variables
// eslint-disable-next-line no-console
console.log('VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY);
// Export a getter for the initialized Firebase app (for Auth, etc.)
export function getFirebaseApp() {
  return initApp();
}
import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseOptions, FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;

const firebaseDebug =
  (typeof import.meta !== 'undefined' && (import.meta.env.VITE_DEBUG_FIREBASE === 'true')) ||
  (typeof process !== 'undefined' && process.env.REACT_APP_DEBUG_FIREBASE === 'true');

function initApp(): FirebaseApp {
  if (cachedApp) return cachedApp;
  if (getApps().length) {
    cachedApp = getApps()[0];
    if (firebaseDebug) console.debug('[Firebase] using existing initialized app', { projectId: firebaseConfig.projectId });
  } else {
    cachedApp = initializeApp(firebaseConfig);
    if (firebaseDebug) console.debug('[Firebase] initialized app', { projectId: firebaseConfig.projectId });
  }
  return cachedApp;
}

export async function getDb(): Promise<Firestore> {
  if (cachedDb) return cachedDb;
  const app = initApp();
  const { getFirestore } = await import('firebase/firestore');
  cachedDb = getFirestore(app);
  if (firebaseDebug) console.debug('[Firebase] getDb() created Firestore instance', { projectId: firebaseConfig.projectId });
  return cachedDb;
}
