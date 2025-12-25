import React, { useEffect, useState } from 'react'
import styles from './ThemeSwitcher.module.css'

const THEMES = ['nightscope', 'warmledger', 'datagrid'] as const
export type ThemeName = typeof THEMES[number]

export function ThemeSwitcher() {
  const [current, setCurrent] = useState<ThemeName>(() => (localStorage.getItem('theme') as ThemeName) || 'nightscope')

  useEffect(() => {
    // apply theme to document and persist
    document.documentElement.setAttribute('data-theme', current)
    try {
      localStorage.setItem('theme', current)
    } catch (e) {
      // ignore if localStorage is not available
    }
  }, [current])

  const setTheme = (t: ThemeName) => {
    setCurrent(t)
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
