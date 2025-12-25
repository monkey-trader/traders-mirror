import React from 'react'
import styles from './ThemeSwitcher.module.css'

const THEMES = ['nightscope', 'warmledger', 'datagrid'] as const
export type ThemeName = typeof THEMES[number]

export function ThemeSwitcher() {
  const current = document.documentElement.getAttribute('data-theme') || 'nightscope'

  const setTheme = (t: ThemeName) => {
    document.documentElement.setAttribute('data-theme', t)
  }

  return (
    <div className={styles.switcher} role="toolbar" aria-label="Theme switcher">
      {THEMES.map(t => (
        <button
          key={t}
          className={[styles.btn, current === t ? styles.active : ''].filter(Boolean).join(' ')}
          onClick={() => setTheme(t)}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

