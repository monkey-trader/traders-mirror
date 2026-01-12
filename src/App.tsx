import React, { useEffect, useState } from 'react';
import { TradeJournal } from '@/presentation/trade/TradeJournal';
import LocalStorageTradeRepository from '@/infrastructure/trade/repositories/LocalStorageTradeRepository';
import FirebaseTradeRepository from '@/infrastructure/trade/repositories/FirebaseTradeRepository';
import { Settings } from '@/presentation/settings/Settings';
import { Layout } from '@/presentation/shared/components/Layout/Layout';
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

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/journal');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
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
      const viteFlag = (import.meta as unknown as { env?: Record<string, unknown> }).env?.[
        'VITE_USE_FIREBASE'
      ];
      const craFlag = (process.env as Record<string, string | undefined>).REACT_APP_USE_FIREBASE;
      const raw = (viteFlag as string | boolean | undefined) ?? craFlag;
      if (typeof raw === 'boolean') return raw;
      if (typeof raw === 'string') return raw.toLowerCase() === 'true';
      return false;
    })();

    const repo = useFirebase
      ? new FirebaseTradeRepository()
      : new LocalStorageTradeRepository(undefined, { seedDefaults: false });
    mainContent = <TradeJournal repo={repo} />;
  }

  return (
    <AuthProvider>
      <ProtectedRoute>
        <Layout fullWidth={true}>
          {/* Simple hash-based routing: #/journal, #/analysis, #/settings.
              Support query/hash params like #/analysis?id=... by matching prefix. */}
          {mainContent}
        </Layout>
      </ProtectedRoute>
      {/* LoginButton wird von ProtectedRoute angezeigt, wenn nicht eingeloggt */}
    </AuthProvider>
  );
}

export default App;
