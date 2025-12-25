import React from 'react'
import styles from './Card.module.css'

export type CardTab = {
  key: string
  title: string
  render?: () => React.ReactNode
}

export type CardProps = {
  title?: string
  children?: React.ReactNode
  className?: string
  tabs?: CardTab[]
  activeTabKey?: string
  onTabChange?: (key: string) => void
}

export function Card({ title, children, className = '', tabs, activeTabKey, onTabChange }: CardProps) {
  const hasTabs = Array.isArray(tabs) && tabs.length > 0
  const activeKey = activeTabKey ?? (hasTabs ? tabs![0].key : undefined)

  return (
    <div className={[styles.card, className].filter(Boolean).join(' ')}>
      {title && <div className={styles.title}>{title}</div>}

      {hasTabs && (
        <div className={styles.tabBar} role="tablist">
          {tabs!.map(tab => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={tab.key === activeKey}
              className={[styles.tab, tab.key === activeKey ? styles.tabActive : ''].filter(Boolean).join(' ')}
              onClick={() => onTabChange?.(tab.key)}
            >
              {tab.title}
            </button>
          ))}
        </div>
      )}

      <div className={styles.content}>
        {hasTabs ? tabs!.find(t => t.key === activeKey)?.render?.() : children}
      </div>
    </div>
  )
}
