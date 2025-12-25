import React from 'react'
import styles from './Header.module.css'
import { ThemeSwitcher } from '../ThemeSwitcher/ThemeSwitcher'

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>Traders Mirror</div>
      <nav className={styles.nav}>
        <a href="#">Journal</a>
        <a href="#">Feed</a>
        <a href="#">Settings</a>
      </nav>
      <div className={styles.controls}>
        <ThemeSwitcher />
      </div>
    </header>
  )
}
