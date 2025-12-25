import React, { useEffect, useState } from "react";
import { TradeJournal } from '@/presentation/trade/TradeJournal'
import { Settings } from '@/presentation/settings/Settings'
import { Layout } from '@/presentation/shared/components/Layout/Layout'

function App() {
  useEffect(() => {
    // set default theme to nightscope on app load
    const stored = localStorage.getItem('theme')
    if (stored) {
      document.documentElement.setAttribute('data-theme', stored)
    } else if (!document.documentElement.getAttribute('data-theme')) {
      document.documentElement.setAttribute('data-theme', 'nightscope')
    }
  }, [])

  const [route, setRoute] = useState(() => window.location.hash || '#/journal')

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/journal')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <Layout fullWidth={true}>
      {/* Simple hash-based routing: #/journal, #/feed, #/settings */}
      {route === '#/settings' ? <Settings /> : <TradeJournal />}
    </Layout>
  )
}

export default App;
