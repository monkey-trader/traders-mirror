// Setups Rubrik für Marktanalysen
// Jede Setup-Konstante ist ein string identifier + label für UI-Auswahl

export type SetupKey =
  | 'double-advantage'
  | 'daily-50-wick'
  | 'ema-50-4h'
  | 'ema-50-weekly'
  | 'ema-50-daily'
  | 'ema-200'
  | 'fair-value-gap'
  | 'cme-close'
  | 'liquidity-cluster'
  | 'liquidity-single'
  | 'fib-level'
  | 'fib-0.5'
  | 'fib-0.559'
  | 'fib-0.618'
  | 'fib-0.667'
  | 'fib-0.786';

// Neues Setup-Modell für optionale Zusatzinfos (z.B. Level)
export type AnalysisSetup = {
  key: SetupKey;
  value?: string; // z.B. "0.618 (94660.7)"
};

export const SETUPS: { key: SetupKey; label: string }[] = [
  { key: 'double-advantage', label: 'Doppelter Vorteil' },
  { key: 'daily-50-wick', label: '50% Wicks im Daily' },
  { key: 'ema-50-4h', label: 'EMA 50 im 4H' },
  { key: 'ema-50-weekly', label: 'EMA 50 im Weekly' },
  { key: 'ema-50-daily', label: 'EMA 50 im Daily' },
  { key: 'ema-200', label: 'EMA 200' },
  { key: 'fair-value-gap', label: 'Fair Value Gaps' },
  { key: 'cme-close', label: 'CME-Close' },
  { key: 'liquidity-cluster', label: 'Liquidität cluster' },
  { key: 'liquidity-single', label: 'Einzelne Liqui Level' },
  { key: 'fib-level', label: 'Fib Level (frei)' },
];
