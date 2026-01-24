import type { AnalysisSetup } from './setups';

export type AnalysisFormValues = {
  symbol: string;
  notes?: string;
  market?: 'Forex' | 'Crypto';
  setups?: AnalysisSetup[];
};

export function validateAll(values: AnalysisFormValues) {
  const errors: Partial<Record<keyof AnalysisFormValues, string>> = {};
  if (!values.symbol || values.symbol.trim() === '') errors.symbol = 'Symbol ist erforderlich';
  if (values.symbol && values.symbol.length > 20) errors.symbol = 'Symbol zu lang';
  return errors;
}

// Validation for a trading suggestion (used in tests)
export type Suggestion = {
  symbol: string;
  price: number;
  size?: number;
  side?: 'LONG' | 'SHORT';
};

export function validateSuggestion(input: Suggestion) {
  const errors: Array<{ field: string; message: string } | null> = [];
  if (!input.symbol || input.symbol.trim() === '')
    errors.push({ field: 'symbol', message: 'Symbol required' });
  if (!input.price || input.price <= 0)
    errors.push({ field: 'price', message: 'Price must be positive' });
  return errors;
}
