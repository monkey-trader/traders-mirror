import React from 'react'
import styles from './Layout.module.css'
import { Header } from '../Header/Header'

export type LayoutProps = {
  children?: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.shell}>
      <div className="app-container">
        <Header />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  )
}

