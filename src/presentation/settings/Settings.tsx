import React, { useEffect, useState } from 'react'
import styles from './Settings.module.css'
import { ThemeSwitcher } from '@/presentation/shared/components/ThemeSwitcher/ThemeSwitcher'

export function Settings() {
  // layout full width preference persisted
  const [fullWidth, setFullWidth] = useState<boolean>(() => {
    const stored = localStorage.getItem('layoutFullWidth')
    return stored === null ? true : stored === 'true'
  })

  useEffect(() => {
    try {
      localStorage.setItem('layoutFullWidth', String(fullWidth))
    } catch (e) {
      // ignore
    }
    // dispatch an in-app event so App updates immediately
    window.dispatchEvent(new CustomEvent('layout:fullWidth', { detail: fullWidth }))
  }, [fullWidth])

  return (
    <div className={styles.container}>
      <h2>Settings</h2>

      <section className={styles.section}>
        <h3>Look & Feel</h3>
        <p className={styles.help}>Choose a theme to apply the color scheme across the app. This setting is saved to your browser.</p>
        <div className={styles.themeRow}>
          <ThemeSwitcher />
        </div>
      </section>

      <section className={styles.section}>
        <h3>Layout</h3>
        <label className={styles.switchLabel}>
          <input type="checkbox" checked={fullWidth} onChange={(e) => setFullWidth(e.target.checked)} />
          Keep app fullscreen (full width)
        </label>
        <p className={styles.help}>When enabled the app uses the entire browser width. Disable to clamp content to a centered container.</p>
      </section>
    </div>
  )
}
