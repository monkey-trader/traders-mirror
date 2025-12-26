import React from 'react'
import styles from './Settings.module.css'
import { ThemeSwitcher } from '@/presentation/shared/components/ThemeSwitcher/ThemeSwitcher'
import { loadSettings, saveSettings } from './settingsStorage'
import { Switch } from '@/presentation/shared/components/Switch/Switch'
import { Button } from '@/presentation/shared/components/Button/Button'
import LocalStorageTradeRepository from '@/infrastructure/trade/repositories/LocalStorageTradeRepository'

function DebugToggle() {
  const [enabled, setEnabled] = React.useState<boolean>(() => {
    const s = loadSettings()
    // if env var is set, treat as default but still allow user override
    const envDefault = typeof process !== 'undefined' && (process.env.REACT_APP_DEBUG_UI === 'true' || process.env.NODE_ENV === 'development')
    return typeof s.debugUI === 'boolean' ? s.debugUI : envDefault
  })

  const onToggle = (v: boolean) => {
    setEnabled(v)
    const s = loadSettings()
    saveSettings({ ...s, debugUI: v })
  }

  return (
    <div className={styles.debugRow}>
      <label className={styles.fieldLabel}>Debug UI</label>
      <div>
        <Switch checked={enabled} onChange={onToggle} ariaLabel="Toggle debug UI" />
      </div>
      <p className={styles.help}>Enable developer UI features (status banners, extra logs). Stored in browser settings.</p>
    </div>
  )
}

function StorageControls() {
  const clearStoredTrades = () => {
    if (!window.confirm('Alle gespeicherten Trades entfernen? Diese Aktion kann nicht rückgängig gemacht werden.')) return
    try {
      localStorage.removeItem('mt_trades_v1')
      // reload so app uses the now-empty repository
      window.location.reload()
    } catch (err) {
      console.error('Failed to clear stored trades', err)
      alert('Fehler beim Löschen der gespeicherten Trades. Siehe Konsole.')
    }
  }

  const restoreDemoData = () => {
    if (!window.confirm('Demo-Daten wiederherstellen? Existierende Daten werden überschrieben.')) return
    try {
      // remove existing key then instantiate repository which will seed defaults
      localStorage.removeItem('mt_trades_v1')
      // ctor with defaults (seedDefaults default true) writes defaults into storage
      // eslint-disable-next-line no-new
      new LocalStorageTradeRepository()
      window.location.reload()
    } catch (err) {
      console.error('Failed to restore demo trades', err)
      alert('Fehler beim Wiederherstellen der Demo-Daten. Siehe Konsole.')
    }
  }

  return (
    <div className={styles.debugRow} style={{ alignItems: 'center' }}>
      <label className={styles.fieldLabel}>Storage</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="secondary" onClick={clearStoredTrades}>Clear stored trades</Button>
        <Button variant="ghost" onClick={restoreDemoData}>Restore demo data</Button>
      </div>
      <p className={styles.help}>Remove or restore the demo trades stored in your browser localStorage (key: mt_trades_v1).</p>
    </div>
  )
}

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

      <section className={styles.section}>
        <h3>Debug</h3>
        <DebugToggle />
        <StorageControls />
      </section>

    </div>
  )
}
