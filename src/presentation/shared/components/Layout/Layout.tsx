import React from 'react'
import styles from './Layout.module.css'
import { Header } from '../Header/Header'

export type LayoutProps = {
  children?: React.ReactNode
  fullWidth?: boolean
}

export function Layout({ children, fullWidth = false }: LayoutProps) {
  return (
    <div className={styles.shell}>
      <div className={fullWidth ? `app-container ${styles.fullWidth}` : 'app-container'}>
        <Header />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  )
}
