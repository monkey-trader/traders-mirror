import React, { useEffect, useState, useCallback } from 'react'
import styles from './Toast.module.css'

export type ToastType = 'success' | 'error' | 'info'

type ToastItem = { id: string; msg: string; type: ToastType }

export function useToast(ttl = 4000) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((msg: string, t: ToastType = 'info') => {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 7)
    const item: ToastItem = { id, msg, type: t }
    setToasts((s) => [...s, item])
    // auto remove
    setTimeout(() => {
      setToasts((s) => s.filter((x) => x.id !== id))
    }, ttl)
    return id
  }, [ttl])

  const dismiss = useCallback((id: string) => {
    setToasts((s) => s.filter((x) => x.id !== id))
  }, [])

  const ToastElement = (
    <div aria-live="polite" aria-atomic="true">
      {toasts.map((t) => (
        <div key={t.id} className={`${styles.toast} ${styles[t.type]}`} role="status">
          <span>{t.msg}</span>
          <button aria-label="dismiss" className={styles.dismiss} onClick={() => dismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  )

  return { showToast, dismiss, ToastElement }
}

export default function Toast() { return null }
