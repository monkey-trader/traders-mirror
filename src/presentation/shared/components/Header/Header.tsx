import React from 'react'
import styles from './Header.module.css'

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>Traders Mirror</div>
      <nav className={styles.nav}>
        <a href="#/journal">Journal</a>
        <a href="#/settings">Settings</a>
      </nav>
      <div className={styles.controls}>
        {/* Theme toggles moved to Settings page */}
      </div>
    </header>
  )
}
