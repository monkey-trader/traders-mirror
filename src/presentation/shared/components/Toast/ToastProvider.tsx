import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import styles from './Toast.module.css';

type ToastType = 'info' | 'success' | 'error';
type ToastItem = { id: string; message: string; type: ToastType; leaving?: boolean };

type ToastContextShape = { addToast: (message: string, type?: ToastType) => void };

const ToastContext = createContext<ToastContextShape | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, number>>({});

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    const tmr = timers.current[id];
    if (tmr) {
      clearTimeout(tmr);
      delete timers.current[id];
    }
  }, []);

  const startDismiss = useCallback(
    (id: string) => {
      // mark leaving so CSS can animate exit
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      // remove after animation (match CSS 280ms)
      const tmr = window.setTimeout(() => remove(id), 320);
      timers.current[id] = tmr as unknown as number;
    },
    [remove]
  );

  const addToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const item: ToastItem = { id, message, type };
      setToasts((s) => [item, ...s]);
      const tmr = window.setTimeout(() => startDismiss(id), 4000);
      timers.current[id] = tmr as unknown as number;
    },
    [remove]
  );

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach((t) => clearTimeout(t));
      timers.current = {};
    };
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className={styles.container} aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styles.toast} ${styles[t.type]} ${
              t.leaving ? styles.leaving : styles.entering
            }`}
            role="status"
          >
            <div className={styles.left}>
              <span className={styles.icon} aria-hidden>
                {t.type === 'success' ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : t.type === 'error' ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path
                      d="M12 8v4l2 2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <div className={styles.message}>{t.message}</div>
            </div>
            <button
              className={styles.close}
              onClick={() => startDismiss(t.id)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  // Tests and isolated components may render without the provider; return a no-op API instead
  return ctx ?? { addToast: () => {} };
}

export default ToastProvider;
