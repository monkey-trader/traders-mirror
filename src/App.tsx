import React, { useEffect, useState } from 'react';
import { useFirebaseAuth } from '@/presentation/shared/hooks/useFirebaseAuth';
import { TradeJournal } from '@/presentation/trade/TradeJournal';
import { createTradeRepository } from '@/infrastructure/repositories';
import { loadSettings } from '@/presentation/settings/settingsStorage';
import { Settings } from '@/presentation/settings/Settings';
import { Layout } from '@/presentation/shared/components/Layout/Layout';
import { Analysis } from '@/presentation/analysis/Analysis';

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

  const { user, signIn, signOut } = useFirebaseAuth();
  let mainContent: React.ReactNode;
  if (isSettings) {
    mainContent = <Settings />;
  } else if (isAnalysis) {
    mainContent = <Analysis />;
  } else {
    // create repo at composition root and inject into TradeJournal
    // Decide whether to use Firebase based on user settings or env default
    const settings = typeof globalThis !== 'undefined' ? loadSettings() : {};
    const debugUiEnabled =
      typeof settings.debugUI === 'boolean'
        ? settings.debugUI
        : typeof process !== 'undefined' &&
          (process.env.REACT_APP_DEBUG_UI === 'true' || process.env.NODE_ENV === 'development');
    const repo = createTradeRepository(debugUiEnabled);
    mainContent = <TradeJournal repo={repo} />;
  }

  return (
    <Layout fullWidth={true}>
      <div style={{ position: 'absolute', top: 8, right: 16, zIndex: 1000 }}>
        {user ? (
          <>
            <span style={{ marginRight: 8 }}>Signed in as {user.displayName || user.email}</span>
            <button onClick={signOut}>Sign out</button>
          </>
        ) : (
          <button onClick={signIn}>Sign in with Google</button>
        )}
      </div>
      {/* Simple hash-based routing: #/journal, #/analysis, #/settings.
          Support query/hash params like #/analysis?id=... by matching prefix. */}
      {mainContent}
    </Layout>
  );
}

export default App;
