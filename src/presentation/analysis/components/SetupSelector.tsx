import React from 'react';
import styles from './SetupSelector.module.css';

const FIB_LEVELS = ['Fib 0.5', 'Fib 0.559', 'Fib 0.618', 'Fib 0.667', 'Fib 0.786'];

const CONFLUENCE_SETUPS = [
  'Doppelter Vorteil',
  '50% Wicks im Daily',
  'EMA 50 im 4H',
  'EMA 50 im Weekly',
  'EMA 50 im Daily',
  'EMA 200',
  'Fair Value Gaps',
  'CME-Close',
  'Liquidität cluster',
  'Einzelne Liqui Level',
];

export type SetupSelectorProps = {
  selectedFibLevels: string[];
  selectedConfluence: string[];
  onChange: (fibLevels: string[], confluence: string[]) => void;
};

export function SetupSelector({
  selectedFibLevels,
  selectedConfluence,
  onChange,
}: SetupSelectorProps) {
  function toggle(arr: string[], value: string) {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  }

  function handleFibClick(fib: string) {
    const newFib = toggle(selectedFibLevels, fib);
    onChange(newFib, selectedConfluence);
  }

  function handleConfluenceClick(conf: string) {
    const newConf = toggle(selectedConfluence, conf);
    onChange(selectedFibLevels, newConf);
  }

  return (
    <div className={styles.root}>
      <div className={styles.section}>
        <div className={styles.title}>SK Entry</div>
        <div className={styles.chipRow}>
          {FIB_LEVELS.map((fib) => (
            <button
              key={fib}
              type="button"
              className={selectedFibLevels.includes(fib) ? styles.chipSelected : styles.chip}
              onClick={() => handleFibClick(fib)}
            >
              {fib}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.title}>Confluence</div>
        <div className={styles.chipRow}>
          {CONFLUENCE_SETUPS.map((conf) => (
            <button
              key={conf}
              type="button"
              className={selectedConfluence.includes(conf) ? styles.chipSelected : styles.chip}
              onClick={() => handleConfluenceClick(conf)}
            >
              {conf}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
// DEPRECATED: This component is no longer used. All SK Entry/Confluence selection logic has been removed from analysis.
