import React, { useEffect } from "react";
import { TradeJournal } from '@/presentation/trade/TradeJournal'

function App() {
  useEffect(() => {
    // set default theme to nightscope on app load
    if (!document.documentElement.getAttribute('data-theme')) {
      document.documentElement.setAttribute('data-theme', 'nightscope')
    }
  }, [])

  return (
    <div className="app-container">
      {/* Render the TradeJournal UI prototype */}
      <TradeJournal />
    </div>
  )
}

export default App;
