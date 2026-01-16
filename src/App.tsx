import React, { useEffect, useState } from 'react';
import { TradeJournal } from '@/presentation/trade/TradeJournal';
import FirebaseTradeRepository from '@/infrastructure/trade/repositories/FirebaseTradeRepository';
import HybridTradeRepository from '@/infrastructure/trade/repositories/HybridTradeRepository';
import { Settings } from '@/presentation/settings/Settings';
import { Layout } from '@/presentation/shared/components/Layout/Layout';
import ToastProvider from '@/presentation/shared/components/Toast/ToastProvider';
import { Analysis } from '@/presentation/analysis/Analysis';
import { AuthProvider } from '@/presentation/auth/AuthProvider';
import { ProtectedRoute } from '@/presentation/auth/ProtectedRoute';

function App() {
  useEffect(() => {
    // set default theme to nightscope on app load
    const stored = localStorage.getItem('theme');
    if (stored) {
      document.documentElement.setAttribute('data-theme', stored);
    } else if (!document.documentElement.getAttribute('data-theme')) {
      document.documentElement.setAttribute('data-theme', 'nightscope');
    }
  }, []);

  const [route, setRoute] = useState(() => window.location.hash || '#/journal');
  // Re-create repositories when settings change (e.g., Cloud Sync toggle)
  const [repoVersion, setRepoVersion] = useState(0);

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/journal');
    window.addEventListener('hashchange', onHash);
    const onSettingsChanged = () => setRepoVersion((v) => v + 1);
    globalThis.addEventListener('settings-changed', onSettingsChanged as EventListener);
    // Storage changes (e.g., manual edits) can also affect settings
    globalThis.addEventListener('storage', onSettingsChanged as EventListener);
    return () => {
      window.removeEventListener('hashchange', onHash);
      globalThis.removeEventListener('settings-changed', onSettingsChanged as EventListener);
      globalThis.removeEventListener('storage', onSettingsChanged as EventListener);
    };
  }, []);

  const isSettings = route.startsWith('#/settings');
  const isAnalysis = route.startsWith('#/analysis');

  let mainContent: React.ReactNode;
  if (isSettings) {
    mainContent = <Settings />;
  } else if (isAnalysis) {
    mainContent = <Analysis />;
  } else {
    // create repo at composition root and inject into TradeJournal
    // Choose Firebase or LocalStorage based on env flag
    const useFirebase = (() => {
      const env = (import.meta as unknown as { env?: Record<string, unknown> }).env ?? {};
      const viteFlag = env['VITE_USE_FIREBASE'];
      const craFlag = (process.env as Record<string, string | undefined>).REACT_APP_USE_FIREBASE;
      const raw = (viteFlag as string | boolean | undefined) ?? craFlag;
      const explicitToggle =
        typeof raw === 'boolean'
          ? raw
          : typeof raw === 'string'
          ? raw.toLowerCase() === 'true'
          : false;
      // If Firebase config keys exist, default to using Firebase even if toggle is missing
      const hasFirebaseConfig = Boolean(
        (env['VITE_FIREBASE_API_KEY'] as string | undefined) ||
          (process.env as Record<string, string | undefined>).REACT_APP_FIREBASE_API_KEY
      );
      return explicitToggle || hasFirebaseConfig;
    })();
    const userPrefUseCloud = (() => {
      try {
        const raw = localStorage.getItem('mt_user_settings_v1');
        if (!raw) return undefined;
        const parsed = JSON.parse(raw) as { useCloudSync?: boolean };
        return typeof parsed.useCloudSync === 'boolean' ? parsed.useCloudSync : undefined;
      } catch {
        return undefined;
      }
    })();
    const effectiveUseFirebase = useFirebase && userPrefUseCloud !== false;

    // Offline-first: Local as source of truth, sync to Firebase when enabled
    const repo = (() => {
      void repoVersion; // reference to ensure re-computation when settings change
      if (effectiveUseFirebase) {
        const remote = new FirebaseTradeRepository();
        return new HybridTradeRepository({ remote });
      }
      // No remote configured: behave like pure LocalStorage
      return new HybridTradeRepository();
    })();
    mainContent = <TradeJournal repo={repo} />;
  }

  return (
    <AuthProvider>
      <ProtectedRoute>
        <ToastProvider>
          <Layout fullWidth={true}>
            {/* Simple hash-based routing: #/journal, #/analysis, #/settings.
                Support query/hash params like #/analysis?id=... by matching prefix. */}
            {mainContent}
          </Layout>
        </ToastProvider>
      </ProtectedRoute>
      {/* LoginButton wird von ProtectedRoute angezeigt, wenn nicht eingeloggt */}
    </AuthProvider>
  );
}

export default App;
