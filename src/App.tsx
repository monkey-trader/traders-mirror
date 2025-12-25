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

  // Persisted layout preference (fullWidth). Default: true (fullscreen layout)
  const [fullWidth, setFullWidth] = useState<boolean>(() => {
    const stored = localStorage.getItem('layoutFullWidth')
    return stored === null ? true : stored === 'true'
  })

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/journal')
    window.addEventListener('hashchange', onHash)

    // Listen for other tabs or settings changes via storage events
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'layoutFullWidth') {
        setFullWidth(e.newValue === null ? true : e.newValue === 'true')
      }
    }

    // Also listen for a custom in-app event dispatched by Settings for immediate updates
    const onCustom = (e: Event) => {
      // @ts-ignore detail is provided by dispatch
      const detail = (e as CustomEvent).detail
      if (typeof detail === 'boolean') setFullWidth(detail)
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener('layout:fullWidth', onCustom as EventListener)

    return () => {
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('layout:fullWidth', onCustom as EventListener)
    }
  }, [])

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/journal')
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <Layout fullWidth={fullWidth}>
      {/* Simple hash-based routing: #/journal, #/feed, #/settings */}
      {route === '#/settings' ? <Settings /> : <TradeJournal />}
    </Layout>
  )
}

export default App;
