import React, { useEffect, useState } from 'react';
import { TradeJournal } from '@/presentation/trade/TradeJournal';
import LocalStorageTradeRepository from '@/infrastructure/trade/repositories/LocalStorageTradeRepository';
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

  let mainContent: React.ReactNode;
  if (isSettings) {
    mainContent = <Settings />;
  } else if (isAnalysis) {
    mainContent = <Analysis />;
  } else {
    // create repo at composition root and inject into TradeJournal
    // Do not seed default mock trades for the running app; keep storage empty on first-run
    const repo = new LocalStorageTradeRepository(undefined, { seedDefaults: false });
    mainContent = <TradeJournal repo={repo} />;
  }

  return (
    <Layout fullWidth={true}>
      {/* Simple hash-based routing: #/journal, #/analysis, #/settings.
          Support query/hash params like #/analysis?id=... by matching prefix. */}
      {mainContent}
    </Layout>
  );
}

export default App;
