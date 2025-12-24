import React, { useEffect, useState } from 'react'
import styles from './Toast.module.css'

export type ToastType = 'success' | 'error' | 'info'

export function useToast(ttl = 4000) {
  const [message, setMessage] = useState<string | null>(null)
  const [type, setType] = useState<ToastType>('info')

  function showToast(msg: string, t: ToastType = 'info') {
    setMessage(msg)
    setType(t)
  }

  useEffect(() => {
    if (!message) return
    const id = setTimeout(() => setMessage(null), ttl)
    return () => clearTimeout(id)
  }, [message, ttl])

  const ToastElement = message ? (
    <div className={`${styles.toast} ${styles[type]}`} role="status" aria-live="polite">
      {message}
    </div>
  ) : null

  return { showToast, ToastElement }
}

export default function Toast() { return null }

