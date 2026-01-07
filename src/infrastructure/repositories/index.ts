import LocalStorageTradeRepository from '@/infrastructure/trade/repositories/LocalStorageTradeRepository';
import { LocalStorageAnalysisRepository } from '@/infrastructure/analysis/repositories/LocalStorageAnalysisRepository';
import DualTradeRepository from '@/infrastructure/trade/repositories/DualTradeRepository';
import DualAnalysisRepository from '@/infrastructure/analysis/repositories/DualAnalysisRepository';
// Removed unused imports for FirebaseTradeRepository and FirebaseAnalysisRepository


/**
 * Create a TradeRepository instance. If `useFirebase` is true the Firestore adapter is returned.
 * By default this reads the `VITE_USE_FIREBASE` env flag.
 */
export function createTradeRepository(useFirebase?: boolean) {
  const envDefault = typeof import.meta !== 'undefined' && import.meta.env.VITE_USE_FIREBASE === 'true';
  const use = typeof useFirebase === 'boolean' ? useFirebase : envDefault;
  if (use) {
    // Use dual repo: local-first, sync to firebase
    return new DualTradeRepository();
  }
  return new LocalStorageTradeRepository();
}

/**
 * Create an AnalysisRepository instance. If `useFirebase` is true the Firestore adapter is returned.
 * By default this reads the `VITE_USE_FIREBASE` env flag.
 */
export function createAnalysisRepository(useFirebase?: boolean) {
  const envDefault = typeof import.meta !== 'undefined' && import.meta.env.VITE_USE_FIREBASE === 'true';
  const use = typeof useFirebase === 'boolean' ? useFirebase : envDefault;
  if (use) {
    // Use dual repo: local-first, sync to firebase
    return new DualAnalysisRepository();
  }
  return new LocalStorageAnalysisRepository();
}
