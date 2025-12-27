import React, { useState } from 'react'
import styles from './Header.module.css'

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className={styles.header}>
      <div className={styles.brand}>Traders Mirror</div>

      <nav className={styles.nav}>
        <a href="#/journal">Journal</a>
        <a href="#/analysis">Analyse</a>
        <a href="#/settings">Settings</a>
      </nav>

      <button
        className={styles.hamburger}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(v => !v)}
      >
        {/* simple three-lines icon */}
        <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <rect y="1" width="20" height="2" rx="1" fill="currentColor" />
          <rect y="6" width="20" height="2" rx="1" fill="currentColor" />
          <rect y="11" width="20" height="2" rx="1" fill="currentColor" />
        </svg>
      </button>

      <div className={`${styles.mobileNav} ${mobileOpen ? 'open' : ''}`} role="menu" aria-hidden={!mobileOpen}>
        <a href="#/journal" role="menuitem" onClick={() => setMobileOpen(false)}>Journal</a>
        <a href="#/analysis" role="menuitem" onClick={() => setMobileOpen(false)}>Analyse</a>
        <a href="#/settings" role="menuitem" onClick={() => setMobileOpen(false)}>Settings</a>
      </div>

      <div className={styles.controls}>
        {/* Theme toggles moved to Settings page */}
      </div>
    </header>
  )
}
