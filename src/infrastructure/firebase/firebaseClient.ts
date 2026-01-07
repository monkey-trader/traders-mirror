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

function initApp(): FirebaseApp {
  if (cachedApp) return cachedApp;
  cachedApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return cachedApp;
}

export async function getDb(): Promise<Firestore> {
  if (cachedDb) return cachedDb;
  const app = initApp();
  const { getFirestore } = await import('firebase/firestore');
  cachedDb = getFirestore(app);
  return cachedDb;
}
