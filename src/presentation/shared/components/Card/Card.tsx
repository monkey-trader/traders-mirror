import React from 'react'
import styles from './Card.module.css'

export type CardProps = {
  title?: string
  children?: React.ReactNode
  className?: string
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={[styles.card, className].filter(Boolean).join(' ')}>
      {title && <div className={styles.title}>{title}</div>}
      <div className={styles.content}>{children}</div>
    </div>
  )
}

