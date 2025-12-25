import React from 'react'
import styles from './Settings.module.css'
import { ThemeSwitcher } from '@/presentation/shared/components/ThemeSwitcher/ThemeSwitcher'

export function Settings() {
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

    </div>
  )
}
