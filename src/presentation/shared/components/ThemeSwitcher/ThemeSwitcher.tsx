import React, { useEffect, useState } from 'react';
import styles from './ThemeSwitcher.module.css';

const THEMES = [
  'nightscope',
  'warmledger',
  'datagrid',
  'solarized',
  'neon',
  'forest',
  'sunrise',
  'mono',
  'aurora',
] as const;
export type ThemeName = (typeof THEMES)[number];

const SWATCH: Record<ThemeName, string> = {
  nightscope: 'linear-gradient(90deg,#58d68d,#00bcd4)',
  warmledger: 'linear-gradient(90deg,#f7b267,#f26d3d)',
  datagrid: 'linear-gradient(90deg,#4fb3ff,#2b8bff)',
  solarized: 'linear-gradient(90deg,#2aa198,#b58900)',
  neon: 'linear-gradient(90deg,#ff2dd4,#00ffd5)',
  forest: 'linear-gradient(90deg,#79c267,#2e8b57)',
  sunrise: 'linear-gradient(90deg,#ff7a59,#ffd166)',
  mono: 'linear-gradient(90deg,#cfcfcf,#9a9a9a)',
  aurora: 'linear-gradient(90deg,#8b5cf6,#3de7c9,#ffd27a)',
};

export function ThemeSwitcher() {
  const [current, setCurrent] = useState<ThemeName>(
    () => (localStorage.getItem('theme') as ThemeName) || 'nightscope'
  );

  useEffect(() => {
    // apply theme to document and persist
    document.documentElement.setAttribute('data-theme', current);
    try {
      localStorage.setItem('theme', current);
    } catch (e) {
      // ignore if localStorage is not available
    }
  }, [current]);

  const setTheme = (t: ThemeName) => {
    setCurrent(t);
  };

  return (
    <div className={styles.switcher} role="toolbar" aria-label="Theme switcher">
      {THEMES.map((t) => (
        <button
          key={t}
          className={[styles.btn, current === t ? styles.active : ''].filter(Boolean).join(' ')}
          onClick={() => setTheme(t)}
          title={t}
        >
          <span className={styles.swatch} style={{ background: SWATCH[t] }} aria-hidden />
          <span className={styles.label}>{t}</span>
        </button>
      ))}
    </div>
  );
}
